import { describe, expect, it } from 'vitest';
import { CustomerTier, Priority, Sentiment } from '../../generated/prisma/client.js';
import { calculateAutoPriority } from './sentimentScoring.js';

describe('Sentiment & Priority Scoring Engine', () => {
  it('edge case 1: neutral tone + urgent keyword calculates HIGH/URGENT autoPriority', () => {
    const result = calculateAutoPriority({
      sentiment: Sentiment.NEUTRAL,
      sentimentScore: 0.0,
      urgencyKeywords: ['outage', 'refund'],
      category: 'Technical',
      customerTier: CustomerTier.STANDARD,
    });

    expect(result.autoPriority).toBe(Priority.HIGH);
    expect(result.aiReasoning).toContain('neutral tone');
    expect(result.aiReasoning).toContain('urgency keywords');
  });

  it('edge case 2: angry tone + trivial category handles score without panic false alarm', () => {
    const result = calculateAutoPriority({
      sentiment: Sentiment.ANGRY,
      sentimentScore: -0.75,
      urgencyKeywords: [],
      category: 'General',
      customerTier: CustomerTier.STANDARD,
    });

    expect(result.autoPriority).toBe(Priority.MEDIUM);
    expect(result.aiReasoning).toContain('angry tone');
    expect(result.totalScore).toBeLessThan(65);
  });

  it('edge case 3: escalating thread sentiment triggers thread escalation autoPriority URGENT', () => {
    const result = calculateAutoPriority({
      sentiment: Sentiment.ANGRY,
      sentimentScore: -0.9,
      urgencyKeywords: ['broken'],
      category: 'Technical',
      customerTier: CustomerTier.STANDARD,
      previousCustomerReplies: [
        { sentiment: Sentiment.NEUTRAL, sentimentScore: 0.1 },
        { sentiment: Sentiment.FRUSTRATED, sentimentScore: -0.3 },
      ],
    });

    expect(result.isEscalating).toBe(true);
    expect(result.autoPriority).toBe(Priority.URGENT);
    expect(result.aiReasoning).toContain('escalating thread tone');
  });

  it('edge case 4: Enterprise customer + frustrated tone + billing refund risk evaluates to URGENT', () => {
    const result = calculateAutoPriority({
      sentiment: Sentiment.FRUSTRATED,
      sentimentScore: -0.5,
      urgencyKeywords: ['cancel', 'refund'],
      category: 'Billing',
      customerTier: CustomerTier.ENTERPRISE,
    });

    expect(result.autoPriority).toBe(Priority.URGENT);
    expect(result.aiReasoning).toContain('Enterprise tier');
    expect(result.aiReasoning).toContain('Billing refund/churn risk');
  });
});
