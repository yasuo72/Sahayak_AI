import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  Bot,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  FileText,
  Inbox,
  Lock,
  Maximize2,
  MessageSquare,
  Minimize2,
  RefreshCw,
  Search,
  Send,
  UserCog,
  Wand2,
  X,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import type { AuthUser, Priority, Ticket, TicketStatus } from '../../lib/types';
import { cn, formatFullDate, formatRelativeTime, getInitials } from '../../lib/utils';
import { Header } from '../layout/Header';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';
import { Skeleton } from '../ui/Skeleton';

const statuses: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'AUTO_RESOLVED', 'RESOLVED', 'CLOSED'];
const priorities: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const statusBorderColor: Record<TicketStatus, string> = {
  OPEN: '#3b82f6',
  IN_PROGRESS: '#f59e0b',
  AUTO_RESOLVED: '#8b5cf6',
  RESOLVED: '#10b981',
  CLOSED: '#94a3b8',
};

function cleanSubject(sub: string): string {
  if (!sub) return '';
  const stripped = sub.replace(/^(?:re|fw|fwd):\s*/gi, '').trim();
  if (/^re:/i.test(sub)) {
    return `Re: ${stripped.replace(/^(?:re|fw|fwd):\s*/gi, '')}`;
  }
  return sub;
}

export function TicketsPage({
  user,
  onToggleMobileMenu,
  isCustomer,
}: {
  user: AuthUser;
  onToggleMobileMenu?: () => void;
  isCustomer?: boolean;
}) {
  const isStaff = user.role === 'AGENT' || user.role === 'ADMIN';
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | TicketStatus>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | Priority>('ALL');
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('MEDIUM');
  const [email, setEmail] = useState(user.email);
  const [replyBody, setReplyBody] = useState('');
  const [polishedReply, setPolishedReply] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState('');

  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selected = tickets.find((t) => t.id === selectedId) ?? tickets[0] ?? null;

  const filtered = tickets.filter((t) => {
    if (search && !t.subject.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Derive current summary value from selected ticket (no effect needed)
  const summaryValue = editingSummary ? summaryDraft : (selected?.aiSummary ?? '');
  const setSummaryValue = (v: string) => setSummaryDraft(v);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selected?.id, selected?.replies?.length]);

  useEffect(() => {
    void loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadTickets() {
    setIsLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (statusFilter !== 'ALL') params.set('status', statusFilter);
    if (priorityFilter !== 'ALL') params.set('priority', priorityFilter);
    const res = await apiFetch(`/api/tickets?${params}`);
    setIsLoading(false);
    if (!res.ok) {
      setError('Could not load tickets.');
      return;
    }
    const data = (await res.json()) as { tickets: Ticket[] };
    setTickets(data.tickets);
    setSelectedId((cur) => cur ?? data.tickets[0]?.id ?? null);
  }

  async function createTicket(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const res = await apiFetch('/api/tickets', {
      method: 'POST',
      body: JSON.stringify({ subject, description, priority: newPriority, email }),
    });
    const data = (await res.json().catch(() => ({}))) as { ticket?: Ticket; error?: string };
    if (!res.ok || !data.ticket) {
      setError(data.error ?? 'Could not create ticket.');
      return;
    }
    setTickets((prev) => [data.ticket!, ...prev]);
    setSelectedId(data.ticket.id);
    setMobileShowDetail(true);
    setSubject('');
    setDescription('');
    setNewPriority('MEDIUM');
    setShowCreateForm(false);

    // Auto-refetch after 3s to pick up AI enrichment (priority, sentiment, summary)
    setTimeout(() => void loadTickets(), 3000);
  }

  async function updateTicket(id: string, patch: Partial<Ticket> & { assignToMe?: boolean }) {
    const res = await apiFetch(`/api/tickets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    const data = (await res.json().catch(() => ({}))) as { ticket?: Ticket; error?: string };
    if (!res.ok || !data.ticket) {
      setError(data.error ?? 'Could not update ticket.');
      return;
    }
    replace(data.ticket);
  }

  async function createReply(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    const res = await apiFetch(`/api/tickets/${selected.id}/replies`, {
      method: 'POST',
      body: JSON.stringify({ body: replyBody, isInternal }),
    });
    const data = (await res.json().catch(() => ({}))) as { ticket?: Ticket; error?: string };
    if (!res.ok || !data.ticket) {
      setError(data.error ?? 'Could not send reply.');
      return;
    }
    replace(data.ticket);
    setReplyBody('');
    setPolishedReply('');
    setIsInternal(false);
  }

  async function polishReply() {
    setError('');
    setIsPolishing(true);
    const res = await apiFetch('/api/ai/polish-reply', {
      method: 'POST',
      body: JSON.stringify({ draft: replyBody }),
    });
    const data = (await res.json().catch(() => ({}))) as { polished?: string; error?: string };
    setIsPolishing(false);
    if (!res.ok || !data.polished) {
      setError(data.error ?? 'Could not polish reply.');
      return;
    }
    setPolishedReply(data.polished);
  }

  function replace(ticket: Ticket) {
    setTickets((prev) => prev.map((t) => (t.id === ticket.id ? ticket : t)));
    setSelectedId(ticket.id);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        view="tickets"
        onRefresh={loadTickets}
        isRefreshing={isLoading}
        onToggleMobileMenu={onToggleMobileMenu}
        isCustomer={isCustomer ?? user.role === 'CUSTOMER'}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden" data-testid="ticket-workspace">
        {/* Left panel: list */}
        <div
          className={cn(
            'flex flex-col w-full md:w-80 shrink-0 border-r border-slate-200 bg-white overflow-hidden transition-all',
            isFullScreen ? 'hidden' : mobileShowDetail ? 'hidden md:flex' : 'flex',
          )}
          data-testid="ticket-list"
        >
          {/* List header + actions */}
          <div className="px-4 py-3 border-b border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">All Tickets</h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={loadTickets}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
                >
                  <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
                {user.role === 'CUSTOMER' && (
                  <button
                    onClick={() => setShowCreateForm((p) => !p)}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition cursor-pointer"
                    style={{ background: '#6366f1', color: 'white' }}
                  >
                    <Inbox className="size-3" />
                    New
                  </button>
                )}
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Search tickets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-1 focus:ring-indigo-100"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 gap-1.5">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="h-7 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-indigo-400"
              >
                <option value="ALL">All Status</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as typeof priorityFilter)}
                className="h-7 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-indigo-400"
              >
                <option value="ALL">All Priority</option>
                {priorities.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <button
                onClick={loadTickets}
                className="col-span-2 h-7 rounded-md text-xs font-medium text-white transition cursor-pointer"
                style={{ background: '#6366f1' }}
              >
                Apply Filters
              </button>
            </div>
          </div>

          {/* Create ticket inline form */}
          {showCreateForm && user.role === 'CUSTOMER' && (
            <form
              onSubmit={createTicket}
              data-testid="create-ticket-form"
              className="border-b border-slate-100 p-4 space-y-3 bg-slate-50 animate-fade-in"
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-slate-800">New Ticket</h3>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="ticket-email"
                  className="block text-xs font-semibold text-slate-500"
                >
                  Notification Email <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  id="ticket-email"
                  type="email"
                  placeholder="your-email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
                />
                <p className="text-[10px] text-slate-400">Replies and updates will be sent here.</p>
              </div>
              <input
                required
                type="text"
                placeholder="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
              />
              <textarea
                required
                placeholder="Describe your issue..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 resize-none"
              />
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as Priority)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400"
              >
                {priorities.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="w-full h-9 rounded-lg text-sm font-medium text-white transition cursor-pointer"
                style={{ background: '#6366f1' }}
              >
                Submit Ticket
              </button>
            </form>
          )}

          {error && (
            <div className="mx-3 mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Ticket list items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-full px-4 py-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <Skeleton className="h-3 w-48" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4.5 w-16 rounded-full" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <MessageSquare className="size-8 text-slate-300 mb-2" />
                <p className="text-sm text-slate-400">No tickets found.</p>
              </div>
            ) : (
              filtered.map((ticket) => {
                const isSelected = selected?.id === ticket.id;
                return (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(ticket.id);
                      setMobileShowDetail(true);
                    }}
                    className={cn(
                      'w-full text-left px-4 py-3 transition-all border-l-2 cursor-pointer',
                      isSelected
                        ? 'bg-indigo-50 border-l-indigo-500'
                        : 'bg-white hover:bg-slate-50 border-l-transparent',
                    )}
                    style={!isSelected ? { borderLeftColor: statusBorderColor[ticket.status] } : {}}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          'text-sm font-medium truncate',
                          isSelected ? 'text-indigo-900' : 'text-slate-800',
                        )}
                      >
                        {cleanSubject(ticket.subject)}
                      </p>
                      <div className="flex items-center gap-1 shrink-0">
                        {ticket.sentiment && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded border flex items-center gap-1 font-medium"
                            title={`Sentiment: ${ticket.sentiment} (${ticket.sentimentScore?.toFixed(2) ?? '0.00'})`}
                          >
                            <span>
                              {ticket.sentiment === 'ANGRY'
                                ? '😡'
                                : ticket.sentiment === 'FRUSTRATED'
                                  ? '🟧'
                                  : ticket.sentiment === 'CONFUSED'
                                    ? '❓'
                                    : ticket.sentiment === 'POSITIVE'
                                      ? '😊'
                                      : '😐'}
                            </span>
                            <span className="hidden sm:inline text-[10px]">{ticket.sentiment}</span>
                          </span>
                        )}
                        <PriorityBadge priority={ticket.priority} />
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 truncate">
                      {ticket.aiSummary ?? ticket.description}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                      <StatusBadge status={ticket.status} />
                      {ticket.autoPriority && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                          ⚡ Auto: {ticket.autoPriority}
                        </span>
                      )}
                      {ticket.category && (
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-500">
                          {ticket.category}
                        </span>
                      )}
                      <span className="ml-auto text-xs text-slate-400">
                        {formatRelativeTime(ticket.updatedAt)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right panel: detail */}
        <div
          className={cn(
            'flex-1 flex flex-col overflow-hidden bg-slate-50/60 min-w-0 h-full',
            mobileShowDetail ? 'flex' : 'hidden md:flex',
          )}
          data-testid="ticket-detail"
        >
          {selected ? (
            <>
              {/* REGION 1: Top (Fixed Header & Metadata - ultra-compact) */}
              <div className="bg-white border-b border-slate-200/90 px-4 py-2 shrink-0 space-y-1.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setMobileShowDetail(false)}
                  className="md:hidden inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 py-0.5 px-2 rounded bg-indigo-50 border border-indigo-100 cursor-pointer transition"
                >
                  <ArrowLeft className="size-3" />
                  Back to tickets
                </button>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <span>Tickets</span>
                      <ChevronRight className="size-2.5" />
                      <span className="text-slate-600 font-medium truncate max-w-52">
                        {cleanSubject(selected.subject)}
                      </span>
                    </div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                      {cleanSubject(selected.subject)}
                    </h2>
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <StatusBadge status={selected.status} />
                      <PriorityBadge priority={selected.priority} />
                      {selected.autoPriority && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                          ⚡ Auto: {selected.autoPriority}
                        </span>
                      )}
                      {selected.sentiment && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                          <span>
                            {selected.sentiment === 'ANGRY'
                              ? '😡'
                              : selected.sentiment === 'FRUSTRATED'
                                ? '🟧'
                                : selected.sentiment === 'CONFUSED'
                                  ? '❓'
                                  : selected.sentiment === 'POSITIVE'
                                    ? '😊'
                                    : '😐'}
                          </span>
                          <span>{selected.sentiment}</span>
                          {selected.sentimentScore !== null &&
                            selected.sentimentScore !== undefined && (
                              <span className="text-[10px] text-slate-500">
                                ({selected.sentimentScore.toFixed(2)})
                              </span>
                            )}
                        </span>
                      )}
                      {selected.category && (
                        <span className="rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700">
                          {selected.category}
                        </span>
                      )}
                      {selected.customer.tier && (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                          👑 {selected.customer.tier}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">#{selected.id.slice(-8)}</span>
                    </div>
                  </div>

                  {/* Staff controls & Fullscreen toggle */}
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0 ml-auto">
                    {isStaff &&
                      selected.autoPriority &&
                      selected.autoPriority !== selected.priority && (
                        <button
                          type="button"
                          onClick={() =>
                            void updateTicket(selected.id, { priority: selected.autoPriority! })
                          }
                          className="flex items-center gap-1 h-6 rounded-md border border-indigo-300 bg-indigo-50 px-2 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 transition cursor-pointer"
                          title="Adopt AI-calculated autoPriority"
                        >
                          ⚡ Apply AI Priority ({selected.autoPriority})
                        </button>
                      )}
                    {isStaff && (
                      <>
                        <select
                          value={selected.status}
                          onChange={(e) =>
                            void updateTicket(selected.id, {
                              status: e.target.value as TicketStatus,
                            })
                          }
                          className="h-6 rounded-md border border-slate-200 bg-white px-1.5 text-[11px] text-slate-700 outline-none focus:border-indigo-400 cursor-pointer"
                        >
                          {statuses.map((s) => (
                            <option key={s} value={s}>
                              {s.replace(/_/g, ' ')}
                            </option>
                          ))}
                        </select>
                        <select
                          value={selected.priority}
                          onChange={(e) =>
                            void updateTicket(selected.id, { priority: e.target.value as Priority })
                          }
                          className="h-6 rounded-md border border-slate-200 bg-white px-1.5 text-[11px] text-slate-700 outline-none focus:border-indigo-400 cursor-pointer"
                        >
                          {priorities.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => void updateTicket(selected.id, { assignToMe: true })}
                          className="flex items-center gap-1 h-6 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                        >
                          <UserCog className="size-3" />
                          Assign to me
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsFullScreen((prev) => !prev)}
                      className={cn(
                        'flex items-center gap-1 h-6 rounded-md border px-2 text-[11px] font-semibold transition cursor-pointer',
                        isFullScreen
                          ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs',
                      )}
                      title={isFullScreen ? 'Exit Fullscreen' : 'Fullscreen Chat Mode'}
                    >
                      {isFullScreen ? (
                        <Minimize2 className="size-3" />
                      ) : (
                        <Maximize2 className="size-3" />
                      )}
                      <span className="hidden sm:inline">
                        {isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Meta info row */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500 pt-0.5 border-t border-slate-100">
                  <span>
                    <span className="font-semibold text-slate-700">Customer: </span>
                    {selected.customer.name} ({selected.customer.email})
                  </span>
                  <span>
                    <span className="font-semibold text-slate-700">Assigned: </span>
                    {selected.agent?.name ?? 'Unassigned'}
                  </span>
                  <span>
                    <span className="font-semibold text-slate-700">Created: </span>
                    {formatFullDate(selected.createdAt)}
                  </span>
                </div>

                {/* AI Reasoning Banner */}
                {selected.aiReasoning && (
                  <div className="rounded-md border border-indigo-200/90 bg-indigo-50/80 px-2.5 py-1 text-[11px] text-indigo-950 flex items-center gap-1.5">
                    <Bot className="size-3 text-indigo-600 shrink-0" />
                    <span className="font-semibold text-indigo-900 shrink-0">
                      AI Priority Reasoning:
                    </span>
                    <span className="truncate">{selected.aiReasoning}</span>
                  </div>
                )}
              </div>

              {/* REGION 2: Middle (Flexible & Scrollable Message Thread - compact fonts) */}
              <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-5 py-2.5 space-y-2.5 flex flex-col bg-slate-50/50">
                {/* Description & AI Summary Collapsible Card */}
                <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden animate-fade-in transition-all shrink-0">
                  {/* Card Header Bar */}
                  <div className="flex items-center justify-between px-3 py-1 bg-slate-50/90 border-b border-slate-100 select-none">
                    <div className="flex items-center gap-1.5">
                      <FileText className="size-3 text-indigo-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        Issue Overview & Summary
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowOverview((prev) => !prev)}
                      className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-indigo-600 transition cursor-pointer"
                    >
                      <span>{showOverview ? 'Hide Details' : 'View Details'}</span>
                      {showOverview ? (
                        <ChevronUp className="size-3" />
                      ) : (
                        <ChevronDown className="size-3" />
                      )}
                    </button>
                  </div>

                  {/* Card Body */}
                  {showOverview ? (
                    <div className="p-2.5 space-y-1.5">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                          Description
                        </p>
                        <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {selected.description}
                        </p>
                      </div>

                      <div className="pt-1.5 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                            <Bot className="size-3 text-indigo-500" />
                            AI Summary
                          </p>
                          {isStaff && !editingSummary && (
                            <button
                              onClick={() => setEditingSummary(true)}
                              className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold transition cursor-pointer"
                            >
                              Edit
                            </button>
                          )}
                        </div>

                        {editingSummary ? (
                          <div className="space-y-1.5">
                            <textarea
                              value={summaryValue}
                              onChange={(e) => setSummaryValue(e.target.value)}
                              placeholder="Write a brief summary of this ticket..."
                              rows={2}
                              className="w-full text-xs rounded-md border border-slate-200 bg-slate-50 px-2 py-1 outline-none focus:border-indigo-400 focus:bg-white resize-none"
                            />
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingSummary(false);
                                  setSummaryValue(selected.aiSummary ?? '');
                                }}
                                className="px-2 py-0.5 rounded text-[10px] font-medium text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  void updateTicket(selected.id, { aiSummary: summaryValue });
                                  setEditingSummary(false);
                                }}
                                className="px-2 py-0.5 rounded text-[10px] font-medium text-white transition cursor-pointer"
                                style={{ background: '#6366f1' }}
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-600 leading-relaxed italic">
                            {selected.aiSummary || 'No summary has been generated or written yet.'}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div
                      className="px-3 py-1 text-[11px] text-slate-500 truncate cursor-pointer hover:bg-slate-50 transition"
                      onClick={() => setShowOverview(true)}
                    >
                      <span className="font-semibold text-slate-700">Summary: </span>
                      {selected.aiSummary || selected.description}
                    </div>
                  )}
                </div>

                {/* Message Thread */}
                {selected.replies.map((reply, index) => {
                  const isCustomer = reply.author.role === 'CUSTOMER';
                  const isSenderChange =
                    index === 0 || selected.replies[index - 1].author.id !== reply.author.id;

                  return (
                    <article
                      key={reply.id}
                      className={cn(
                        'flex gap-2 animate-fade-in my-0.5',
                        isCustomer
                          ? 'items-start justify-start'
                          : 'items-start justify-end ml-auto',
                        isSenderChange ? 'mt-2.5' : 'mt-1',
                      )}
                    >
                      {/* Customer Avatar (Left) */}
                      {isCustomer && (
                        <div
                          className="flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-2xs mt-0.5"
                          style={{ background: 'linear-gradient(135deg,#3b82f6,#06b6d4)' }}
                        >
                          {getInitials(reply.author.name)}
                        </div>
                      )}

                      <div
                        className={cn(
                          'max-w-[82%] sm:max-w-[68%] flex flex-col',
                          isCustomer ? 'items-start' : 'items-end',
                        )}
                      >
                        {/* Author line */}
                        <div
                          className={cn(
                            'flex items-center gap-1 flex-wrap mb-0.5 text-[11px]',
                            isCustomer ? 'justify-start text-left' : 'justify-end text-right',
                          )}
                        >
                          <span className="font-semibold text-slate-700">{reply.author.name}</span>
                          <span className="text-slate-400 text-[10px]">
                            ({reply.author.role.toLowerCase()})
                          </span>
                          {reply.isInternal && (
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-1 py-0.1 text-[9px] font-semibold text-amber-700">
                              Internal
                            </span>
                          )}
                          {reply.author.name === 'AI System' && (
                            <span className="inline-flex items-center gap-0.5 rounded-full border border-indigo-200 bg-indigo-50 px-1 py-0.1 text-[9px] font-semibold text-indigo-700">
                              <Bot className="size-2" />
                              AI
                            </span>
                          )}
                          <span className="text-slate-400 font-normal text-[10px]">
                            · {formatRelativeTime(reply.createdAt)}
                          </span>
                        </div>

                        {/* Message Bubble - compact fonts */}
                        <div
                          className={cn(
                            'rounded-xl px-3 py-1.5 text-xs leading-relaxed shadow-2xs',
                            reply.isInternal
                              ? 'border border-amber-200 bg-amber-50 text-amber-900 rounded-tr-xs'
                              : isCustomer
                                ? 'border border-slate-200/90 bg-white text-slate-800 rounded-tl-xs'
                                : 'text-white rounded-tr-xs',
                          )}
                          style={
                            !reply.isInternal && !isCustomer
                              ? { background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }
                              : {}
                          }
                        >
                          <p className="whitespace-pre-wrap">{reply.body}</p>
                        </div>
                      </div>

                      {/* Staff/Agent/AI Avatar (Right) */}
                      {!isCustomer && (
                        <div
                          className="flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-2xs mt-0.5"
                          style={{
                            background:
                              reply.author.name === 'AI System'
                                ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                                : 'linear-gradient(135deg,#10b981,#059669)',
                          }}
                        >
                          {reply.author.name === 'AI System' ? (
                            <Bot className="size-3" />
                          ) : (
                            getInitials(reply.author.name)
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}

                {selected.replies.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-6 text-center my-auto">
                    <MessageSquare className="size-6 text-slate-300 mb-1" />
                    <p className="text-xs text-slate-400">
                      No replies yet. Start the conversation below.
                    </p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* REGION 3: Bottom (Fixed Reply Composer - ultra compact) */}
              <div className="shrink-0 border-t border-slate-200/90 bg-white px-3 sm:px-4 py-2 shadow-sm z-10">
                {selected.status === 'CLOSED' && !isStaff && (
                  <div className="flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-600 mb-1.5">
                    <Lock className="size-3 text-slate-500" />
                    This ticket is closed. Contact support to reopen.
                  </div>
                )}
                <form onSubmit={createReply} data-testid="reply-form">
                  <div className="rounded-lg border border-slate-200/90 bg-slate-50/70 p-1.5 space-y-1.5 focus-within:bg-white focus-within:border-indigo-400 transition-all">
                    <textarea
                      required
                      rows={1}
                      placeholder="Write your reply..."
                      value={replyBody}
                      disabled={!isStaff && selected.status === 'CLOSED'}
                      onChange={(e) => {
                        setReplyBody(e.target.value);
                        setPolishedReply('');
                      }}
                      className="w-full min-h-[36px] max-h-[80px] rounded-md border-none bg-transparent px-2 py-1 text-xs text-slate-800 placeholder-slate-400 outline-none resize-none"
                    />

                    {polishedReply && (
                      <div className="rounded-md border border-indigo-200 bg-indigo-50/80 p-2 animate-fade-in">
                        <div className="flex items-center justify-between mb-1">
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-indigo-700">
                            <Wand2 className="size-3" />
                            AI Polished Reply
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setReplyBody(polishedReply);
                              setPolishedReply('');
                            }}
                            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                          >
                            Use this →
                          </button>
                        </div>
                        <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {polishedReply}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                      <div className="flex items-center gap-2">
                        {isStaff && (
                          <label className="flex items-center gap-1.5 cursor-pointer select-none">
                            <div
                              className={cn(
                                'relative w-6 h-3.5 rounded-full transition-colors',
                                isInternal ? 'bg-amber-500' : 'bg-slate-300',
                              )}
                              onClick={() => setIsInternal((p) => !p)}
                            >
                              <div
                                className={cn(
                                  'absolute top-0.5 size-2.5 rounded-full bg-white shadow-2xs transition-transform',
                                  isInternal ? 'translate-x-2.5' : 'translate-x-0.5',
                                )}
                              />
                            </div>
                            <span className="text-[11px] font-semibold text-slate-600">
                              Internal note
                            </span>
                          </label>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 ml-auto">
                        {isStaff && (
                          <button
                            type="button"
                            disabled={!replyBody || isPolishing}
                            onClick={() => void polishReply()}
                            className="flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-40 cursor-pointer"
                          >
                            <Wand2 className={`size-3 ${isPolishing ? 'animate-spin' : ''}`} />
                            {isPolishing ? 'Polishing...' : 'Polish with AI'}
                          </button>
                        )}
                        <button
                          type="submit"
                          disabled={!isStaff && selected.status === 'CLOSED'}
                          className="flex items-center gap-1 rounded-md px-3 py-0.5 text-[11px] sm:text-xs font-semibold text-white transition hover:opacity-90 shadow-2xs disabled:opacity-40 cursor-pointer"
                          style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}
                        >
                          <Send className="size-3" />
                          Send Reply
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center p-8">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-slate-100 mb-4">
                <MessageSquare className="size-8 text-slate-400" />
              </div>
              <h3 className="text-base font-semibold text-slate-700 mb-1">No ticket selected</h3>
              <p className="text-sm text-slate-400">
                Select a ticket from the list to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
