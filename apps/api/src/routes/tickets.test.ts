import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { Priority, Role, TicketStatus } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import { hashPassword } from '../services/auth.js';

const app = createApp();
const testRunId = `phase5-${Date.now()}`;

async function createUser({ email, role = Role.CUSTOMER }: { email: string; role?: Role }) {
  return prisma.user.create({
    data: {
      email,
      name: 'Ticket Test User',
      passwordHash: await hashPassword('Password123!'),
      role,
    },
  });
}

async function login(email: string) {
  const agent = request.agent(app);

  await agent.post('/api/auth/login').send({
    email,
    password: 'Password123!',
  });

  return agent;
}

beforeAll(async () => {
  await prisma.$connect();
});

afterEach(async () => {
  const users = await prisma.user.findMany({
    where: {
      email: {
        startsWith: testRunId,
      },
    },
    select: {
      id: true,
    },
  });
  const userIds = users.map((user) => user.id);

  await prisma.ticket.deleteMany({
    where: {
      OR: [{ customerId: { in: userIds } }, { agentId: { in: userIds } }],
    },
  });
  await prisma.user.deleteMany({
    where: {
      id: {
        in: userIds,
      },
    },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('ticket management', () => {
  it('lets customers create and list only their own tickets', async () => {
    const customer = await createUser({ email: `${testRunId}-customer@test.local` });
    const otherCustomer = await createUser({ email: `${testRunId}-other@test.local` });
    const customerAgent = await login(customer.email);
    const otherAgent = await login(otherCustomer.email);

    const createResponse = await customerAgent.post('/api/tickets').send({
      subject: 'Cannot access billing page',
      description: 'The billing page returns a blank screen after I sign in.',
      priority: Priority.HIGH,
      email: customer.email,
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.ticket).toMatchObject({
      subject: 'Cannot access billing page',
      status: TicketStatus.OPEN,
      priority: Priority.HIGH,
      customer: {
        email: customer.email,
      },
    });
    expect(createResponse.body.ticket.aiSummary).toBeTruthy();

    const ownListResponse = await customerAgent.get('/api/tickets');
    const otherListResponse = await otherAgent.get('/api/tickets');

    expect(ownListResponse.body.tickets).toHaveLength(1);
    expect(otherListResponse.body.tickets).toHaveLength(0);
  });

  it('lets agents view, assign, update workflow, and records audit events', async () => {
    const customer = await createUser({ email: `${testRunId}-workflow-customer@test.local` });
    const agentUser = await createUser({
      email: `${testRunId}-workflow-agent@test.local`,
      role: Role.AGENT,
    });
    const ticket = await prisma.ticket.create({
      data: {
        subject: 'Refund request',
        description: 'Please refund an accidental duplicate payment.',
        customerId: customer.id,
      },
    });
    const agent = await login(agentUser.email);

    const updateResponse = await agent.patch(`/api/tickets/${ticket.id}`).send({
      assignToMe: true,
      status: TicketStatus.IN_PROGRESS,
      priority: Priority.URGENT,
    });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.ticket).toMatchObject({
      status: TicketStatus.IN_PROGRESS,
      priority: Priority.URGENT,
      agent: {
        email: agentUser.email,
      },
    });
    expect(updateResponse.body.ticket.auditEvents.map((event) => event.action)).toEqual(
      expect.arrayContaining([
        'ticket.status_changed',
        'ticket.priority_changed',
        'ticket.assignment_changed',
      ]),
    );
  });

  it('hides internal notes from customers', async () => {
    const customer = await createUser({ email: `${testRunId}-notes-customer@test.local` });
    const agentUser = await createUser({
      email: `${testRunId}-notes-agent@test.local`,
      role: Role.AGENT,
    });
    const ticket = await prisma.ticket.create({
      data: {
        subject: 'Slow dashboard',
        description: 'The dashboard has been slow all morning.',
        customerId: customer.id,
      },
    });
    const agent = await login(agentUser.email);
    const customerAgent = await login(customer.email);

    const replyResponse = await agent.post(`/api/tickets/${ticket.id}/replies`).send({
      body: 'Internal escalation note.',
      isInternal: true,
    });

    expect(replyResponse.status).toBe(201);
    expect(replyResponse.body.ticket.replies.some((reply) => reply.isInternal)).toBe(true);

    const customerViewResponse = await customerAgent.get(`/api/tickets/${ticket.id}`);

    expect(customerViewResponse.status).toBe(200);
    expect(customerViewResponse.body.ticket.replies).toHaveLength(0);
  });

  it('prevents customers from changing workflow fields or replying to closed tickets', async () => {
    const customer = await createUser({ email: `${testRunId}-closed-customer@test.local` });
    const ticket = await prisma.ticket.create({
      data: {
        subject: 'Closed issue',
        description: 'This issue has already been closed.',
        customerId: customer.id,
        status: TicketStatus.CLOSED,
      },
    });
    const customerAgent = await login(customer.email);

    const workflowResponse = await customerAgent.patch(`/api/tickets/${ticket.id}`).send({
      status: TicketStatus.OPEN,
    });
    const replyResponse = await customerAgent.post(`/api/tickets/${ticket.id}/replies`).send({
      body: 'Please reopen this.',
    });

    expect(workflowResponse.status).toBe(403);
    expect(replyResponse.status).toBe(403);
  });

  it('lets agents filter by status and priority', async () => {
    await prisma.ticket.deleteMany({
      where: {
        status: TicketStatus.OPEN,
        priority: Priority.URGENT,
      },
    });

    const customer = await createUser({ email: `${testRunId}-filter-customer@test.local` });
    const agentUser = await createUser({
      email: `${testRunId}-filter-agent@test.local`,
      role: Role.AGENT,
    });
    await prisma.ticket.createMany({
      data: [
        {
          subject: 'Urgent open issue',
          description: 'This is urgent and open.',
          customerId: customer.id,
          status: TicketStatus.OPEN,
          priority: Priority.URGENT,
        },
        {
          subject: 'Low resolved issue',
          description: 'This is low priority and resolved.',
          customerId: customer.id,
          status: TicketStatus.RESOLVED,
          priority: Priority.LOW,
        },
      ],
    });
    const agent = await login(agentUser.email);

    const response = await agent.get('/api/tickets').query({
      status: TicketStatus.OPEN,
      priority: Priority.URGENT,
    });

    expect(response.status).toBe(200);
    expect(response.body.tickets).toHaveLength(1);
    expect(response.body.tickets[0].subject).toBe('Urgent open issue');
  });

  it('auto-resolves simple password reset requests through AI enrichment', async () => {
    const customer = await createUser({ email: `${testRunId}-ai-customer@test.local` });
    const customerAgent = await login(customer.email);

    const response = await customerAgent.post('/api/tickets').send({
      subject: 'How do I reset password?',
      description: 'I forgot my password and need instructions to reset password for my account.',
      priority: Priority.MEDIUM,
      email: customer.email,
    });

    expect(response.status).toBe(201);
    expect(response.body.ticket).toMatchObject({
      status: TicketStatus.AUTO_RESOLVED,
      category: 'Account',
      aiSummary: 'Customer needs help with their support request.',
    });
    expect(response.body.ticket.replies.at(-1)?.body).toContain('generated by AI');
  });

  it('polishes agent replies with the mocked AI provider', async () => {
    const agentUser = await createUser({
      email: `${testRunId}-polish-agent@test.local`,
      role: Role.AGENT,
    });
    const agent = await login(agentUser.email);

    const response = await agent.post('/api/ai/polish-reply').send({
      draft: 'we are checking this soon',
    });

    expect(response.status).toBe(200);
    expect(response.body.polished).toBe(
      'Thanks for reaching out. We are looking into this and will follow up shortly.',
    );
  });

  it('prevents customers from using reply polishing', async () => {
    const customer = await createUser({ email: `${testRunId}-polish-customer@test.local` });
    const customerAgent = await login(customer.email);

    const response = await customerAgent.post('/api/ai/polish-reply').send({
      draft: 'please wait',
    });

    expect(response.status).toBe(403);
  });
});

async function waitForTicket(
  ticketId: string,
  predicate: (
    ticket:
      | (Awaited<ReturnType<typeof loadTicketForTest>> extends infer TicketResult
          ? TicketResult
          : never)
      | null,
  ) => boolean,
) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < 3000) {
    const ticket = await loadTicketForTest(ticketId);

    if (predicate(ticket)) {
      return ticket;
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  return loadTicketForTest(ticketId);
}

async function loadTicketForTest(ticketId: string) {
  return prisma.ticket.findUnique({
    where: {
      id: ticketId,
    },
    include: {
      replies: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });
}
