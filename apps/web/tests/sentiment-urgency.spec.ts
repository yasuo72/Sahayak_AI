import { expect, test } from '@playwright/test';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import pg from 'pg';

config({ path: 'apps/api/.env' });

const testRunId = `e2e-sentiment-${Date.now()}`;
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for Playwright setup.');
}

const client = new pg.Client({ connectionString: databaseUrl });

test.beforeAll(async () => {
  await client.connect();
});

test.afterAll(async () => {
  const users = await client.query<{ id: string }>('select id from "User" where email like $1', [
    `${testRunId}%`,
  ]);
  const userIds = users.rows.map((user) => user.id);

  if (userIds.length > 0) {
    await client.query('delete from "Ticket" where "customerId" = any($1) or "agentId" = any($1)', [
      userIds,
    ]);
    await client.query('delete from "User" where id = any($1)', [userIds]);
  }

  await client.end();
});

test('inbound angry ticket auto-scores to URGENT with mood indicator and AI reasoning string', async ({
  page,
}) => {
  const customerEmail = `${testRunId}-angry-customer@test.local`;
  const agentEmail = `${testRunId}-agent@test.local`;
  const subject = `${testRunId} UNACCEPTABLE: Service down and refund requested`;

  const customerId = await createUser(customerEmail, 'Angry Customer', 'CUSTOMER', 'ENTERPRISE');
  await createUser(agentEmail, 'Agent Smith', 'AGENT', 'STANDARD');

  // Insert angry ticket with sentiment metadata
  await client.query(
    `insert into "Ticket" (id, subject, description, status, priority, "autoPriority", sentiment, "sentimentScore", "urgencyKeywords", "aiReasoning", category, "customerId", "createdAt", "updatedAt") 
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now(), now())`,
    [
      `${testRunId}-ticket`,
      subject,
      'I am extremely angry! Your product is down and completely broken. I demand an immediate refund or I will call my lawyer!',
      'OPEN',
      'MEDIUM',
      'URGENT',
      'ANGRY',
      -0.85,
      ['refund', 'down', 'lawyer'],
      'Flagged URGENT: angry tone (-0.85) + 3 urgency keywords (refund, down, lawyer) + Enterprise tier + Billing refund/churn risk',
      'Billing',
      customerId,
    ],
  );

  await page.goto('/');
  await page.getByLabel('Email Address').fill(agentEmail);
  await page.getByLabel('Password').fill('Password123!');
  await page.getByTestId('auth-form').getByRole('button', { name: 'Sign In' }).click();

  await expect(page.getByText('Agent Smith')).toBeVisible();
  await page.getByRole('button', { name: 'Tickets', exact: true }).click();

  // Verify list item displays Angry mood indicator 😡 and Auto: URGENT pill
  const listItem = page.getByTestId('ticket-list').getByText(subject).first();
  await expect(listItem).toBeVisible();
  await expect(page.getByTestId('ticket-list').getByText('⚡ Auto: URGENT').first()).toBeVisible();

  // Click ticket detail
  await listItem.click();

  // Verify Ticket Detail displays Angry mood, Enterprise tier badge, and AI reasoning banner
  await expect(page.getByTestId('ticket-detail').getByText('ANGRY').first()).toBeVisible();
  await expect(page.getByTestId('ticket-detail').getByText('ENTERPRISE').first()).toBeVisible();
  await expect(
    page.getByTestId('ticket-detail').getByText('AI Priority Reasoning:').first(),
  ).toBeVisible();
  await expect(
    page.getByTestId('ticket-detail').getByText('Flagged URGENT: angry tone').first(),
  ).toBeVisible();

  // Verify agent can adopt AI Priority via the button (since priority=MEDIUM and autoPriority=URGENT)
  await page.getByRole('button', { name: 'Apply AI Priority (URGENT)' }).click();
  await expect(
    page.getByTestId('ticket-detail').locator('select').filter({ hasText: 'URGENT' }).first(),
  ).toHaveValue('URGENT');
});

async function createUser(
  email: string,
  name: string,
  role: 'CUSTOMER' | 'AGENT' | 'ADMIN',
  tier: 'STANDARD' | 'PRO' | 'ENTERPRISE',
) {
  const passwordHash = await bcrypt.hash('Password123!', 12);
  const id = `${testRunId}-${role.toLowerCase()}-${Math.random().toString(36).slice(2)}`;

  await client.query(
    'insert into "User" (id, email, name, "passwordHash", role, tier, "isActive", "createdAt", "updatedAt") values ($1, $2, $3, $4, $5, $6, true, now(), now())',
    [id, email, name, passwordHash, role, tier],
  );

  return id;
}
