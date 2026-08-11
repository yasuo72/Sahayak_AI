import { Router, type ErrorRequestHandler } from 'express';
import { Role, TicketStatus } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import { enrichTicketWithAi } from '../services/ai/ticketAi.js';
import {
  extractEmailAddress,
  retrieveReceivedEmail,
  stripHtml,
} from '../services/email/emailService.js';

export const emailRouter = Router();

interface InboundFields {
  from: string;
  subject: string;
  text: string;
  html?: string | null;
}

async function handleInboundEmail(payload: unknown): Promise<InboundFields | null> {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body = payload as any;
  const data = body.data && typeof body.data === 'object' ? body.data : {};

  // Resolve raw sender field
  const rawFrom =
    data.from ??
    data.sender ??
    data.From ??
    body.from ??
    body.sender ??
    body.From ??
    body['from_email'] ??
    body['sender_email'] ??
    body.envelope?.from ??
    body.headers?.from ??
    body.email;

  // Resolve subject
  const rawSubject =
    data.subject ??
    data.Subject ??
    body.subject ??
    body.Subject ??
    body.headers?.subject ??
    'Support Request';

  // Resolve body text / html
  const rawText =
    data.text ??
    data['body-plain'] ??
    data.body ??
    body.text ??
    body['body-plain'] ??
    body.body ??
    body.TextBody ??
    body['stripped-text'] ??
    body.content;

  const rawHtml = data.html ?? data['body-html'] ?? body.html ?? body['body-html'] ?? body.HtmlBody;

  const senderEmail = extractEmailAddress(rawFrom);

  if (senderEmail && (rawText || rawHtml)) {
    const text =
      typeof rawText === 'string' && rawText.trim()
        ? rawText.trim()
        : stripHtml(typeof rawHtml === 'string' ? rawHtml : '');

    if (text) {
      return {
        from: senderEmail,
        subject:
          typeof rawSubject === 'string' && rawSubject.trim()
            ? rawSubject.trim()
            : 'Support Request',
        text,
        html: typeof rawHtml === 'string' ? rawHtml : null,
      };
    }
  }

  // Fallback for Resend receiving email by ID (checking data.email_id, data.id, body.email_id, body.id)
  const emailId = data.email_id ?? data.id ?? body.email_id ?? body.id;
  if (typeof emailId === 'string' && emailId) {
    const fetched = await retrieveReceivedEmail(emailId);
    if (fetched && fetched.from && (fetched.text || fetched.html)) {
      return fetched;
    }
  }

  // Safe Fallback: If senderEmail is known from payload (e.g. data.from), create ticket even if body was omitted in webhook
  if (senderEmail && senderEmail.includes('@')) {
    const subjectStr =
      typeof rawSubject === 'string' && rawSubject.trim() ? rawSubject.trim() : 'Support Request';
    return {
      from: senderEmail,
      subject: subjectStr,
      text: subjectStr,
      html: null,
    };
  }

  return null;
}

const processedWebhookIds = new Set<string>();
const MAX_PROCESSED_IDS = 1000;

function isDuplicateWebhook(id: unknown): boolean {
  if (typeof id !== 'string' || !id) return false;
  if (processedWebhookIds.has(id)) return true;
  if (processedWebhookIds.size >= MAX_PROCESSED_IDS) {
    const firstKey = processedWebhookIds.values().next().value;
    if (firstKey) processedWebhookIds.delete(firstKey);
  }
  processedWebhookIds.add(id);
  return false;
}

const inboundWebhookHandler = async (
  request: import('express').Request,
  response: import('express').Response,
  next: import('express').NextFunction,
) => {
  try {
    const payload = request.body || {};
    const eventType = payload.type || payload.event || payload.event_type;

    // Ignore webhook events that are not inbound email received (e.g. email.sent, email.delivered, email.opened)
    if (
      typeof eventType === 'string' &&
      eventType &&
      !eventType.includes('received') &&
      !eventType.includes('inbound')
    ) {
      response.status(200).json({
        skipped: true,
        reason: `Ignored webhook event type '${eventType}'. Only email.received is processed.`,
      });
      return;
    }

    // Deduplicate duplicate webhook deliveries (e.g. Sender.net msg_... or email_id)
    const eventId =
      payload.id || payload.data?.id || payload.data?.email_id || payload.data?.message_id;
    if (eventId && isDuplicateWebhook(eventId)) {
      response.status(200).json({
        skipped: true,
        reason: `Duplicate webhook event '${eventId}' ignored.`,
      });
      return;
    }

    const inboundEmail = await handleInboundEmail(request.body);

    if (!inboundEmail || !inboundEmail.from || !inboundEmail.from.includes('@')) {
      response.status(202).json({
        skipped: true,
        reason: 'No email body or valid sender email available in payload.',
      });
      return;
    }

    const senderEmail = extractEmailAddress(inboundEmail.from);
    const supportEmail = (process.env.SUPPORT_EMAIL || 'support@rohitis.online')
      .toLowerCase()
      .trim();

    // Prevent infinite email loops: Ignore emails sent from our own support address or no-reply addresses
    if (
      senderEmail.toLowerCase() === supportEmail ||
      senderEmail.toLowerCase().includes('no-reply') ||
      senderEmail.toLowerCase().includes('noreply') ||
      senderEmail.toLowerCase().includes('ai-assistant')
    ) {
      response.status(200).json({
        skipped: true,
        reason: `Ignored email sent from support address or automated sender (${senderEmail}).`,
      });
      return;
    }
    const customer = await prisma.user.upsert({
      where: {
        email: senderEmail,
      },
      update: {},
      create: {
        email: senderEmail,
        name: senderEmail.split('@')[0] ?? senderEmail,
        passwordHash: 'email-created-user-no-password',
        role: Role.CUSTOMER,
      },
    });

    // Strip leading "Re:", "Fwd:" to match ongoing conversation threads
    const cleanSubject = inboundEmail.subject.replace(/^(re|fwd):\s*/i, '').trim();

    // Check if customer already has an active ticket with matching subject
    const existingTicket = await prisma.ticket.findFirst({
      where: {
        customerId: customer.id,
        status: {
          in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.AUTO_RESOLVED],
        },
        subject: {
          contains: cleanSubject.length > 5 ? cleanSubject : inboundEmail.subject,
          mode: 'insensitive',
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    if (existingTicket) {
      await prisma.reply.create({
        data: {
          ticketId: existingTicket.id,
          authorId: customer.id,
          body: inboundEmail.text,
        },
      });

      // Reopen ticket to IN_PROGRESS if it was AUTO_RESOLVED or update timestamp
      await prisma.ticket.update({
        where: { id: existingTicket.id },
        data: {
          status: TicketStatus.IN_PROGRESS,
          updatedAt: new Date(),
        },
      });

      await prisma.auditEvent.create({
        data: {
          ticketId: existingTicket.id,
          actorId: customer.id,
          action: 'ticket.reply_from_email',
        },
      });

      void enrichTicketWithAi(existingTicket.id, existingTicket.subject, inboundEmail.text);

      response.status(200).json({
        action: 'replied',
        ticketId: existingTicket.id,
        customerId: customer.id,
      });
      return;
    }

    // Otherwise create a brand new ticket
    const ticket = await prisma.ticket.create({
      data: {
        subject: inboundEmail.subject,
        description: inboundEmail.text,
        customerId: customer.id,
      },
    });

    await prisma.reply.create({
      data: {
        ticketId: ticket.id,
        authorId: customer.id,
        body: inboundEmail.text,
      },
    });

    await prisma.auditEvent.create({
      data: {
        ticketId: ticket.id,
        actorId: customer.id,
        action: 'ticket.created_from_email',
      },
    });

    void enrichTicketWithAi(ticket.id, ticket.subject, ticket.description);

    response.status(201).json({
      action: 'created',
      ticketId: ticket.id,
      customerId: customer.id,
    });
  } catch (error) {
    next(error);
  }
};

// Mount handlers on common webhook paths
emailRouter.post('/inbound', inboundWebhookHandler);
emailRouter.post('/inbound/resend', inboundWebhookHandler);
emailRouter.post('/inbound/sender', inboundWebhookHandler);
emailRouter.post('/webhook', inboundWebhookHandler);

const emailErrorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  void _next;
  console.error('Email webhook error:', error);
  response.status(500).json({ error: 'Email webhook failed.' });
};

emailRouter.use(emailErrorHandler);
