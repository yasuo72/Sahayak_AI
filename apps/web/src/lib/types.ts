export type Role = 'CUSTOMER' | 'AGENT' | 'ADMIN';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'AUTO_RESOLVED' | 'RESOLVED' | 'CLOSED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type Sentiment = 'ANGRY' | 'FRUSTRATED' | 'NEUTRAL' | 'CONFUSED' | 'POSITIVE';
export type CustomerTier = 'STANDARD' | 'PRO' | 'ENTERPRISE';
export type NavView = 'dashboard' | 'tickets' | 'users' | 'settings';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  tier?: CustomerTier;
  isActive: boolean;
  createdAt: string;
};

export type Ticket = {
  id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: Priority;
  autoPriority: Priority | null;
  category: string | null;
  aiSummary: string | null;
  sentiment: Sentiment | null;
  sentimentScore: number | null;
  urgencyKeywords: string[];
  aiReasoning: string | null;
  notificationEmail: string | null;
  customer: Pick<AuthUser, 'id' | 'name' | 'email'> & { tier?: CustomerTier };
  agent: Pick<AuthUser, 'id' | 'name' | 'email'> | null;
  replies: TicketReply[];
  createdAt: string;
  updatedAt: string;
};

export type TicketReply = {
  id: string;
  body: string;
  isInternal: boolean;
  sentiment?: Sentiment | null;
  sentimentScore?: number | null;
  createdAt: string;
  author: Pick<AuthUser, 'id' | 'name' | 'email' | 'role'>;
};

export type DashboardData = {
  counts: {
    byStatus: Record<TicketStatus, number>;
    byPriority: Record<Priority, number>;
    byCategory: Record<string, number>;
    autoResolved: number;
    humanResolved: number;
  };
  averageResolutionMs: number | null;
  recentActivity: Array<{
    id: string;
    action: string;
    fromValue: string | null;
    toValue: string | null;
    createdAt: string;
    ticket: { id: string; subject: string };
    actor: Pick<AuthUser, 'id' | 'name' | 'email' | 'role'> | null;
  }>;
};
