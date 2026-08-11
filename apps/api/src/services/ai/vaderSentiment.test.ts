import { describe, expect, it } from 'vitest';
import { analyzeWithVader, reconcileSentiment } from './vaderSentiment.js';
import { Sentiment } from '../../generated/prisma/client.js';

describe('VADER Sentiment Analysis', () => {
  it("detects angry sentiment in Alex's cracked phone email (sentence-level)", () => {
    const text = `Hello Support Team,
I am extremely upset. I ordered a new phone last week. It arrived today,
but the screen is completely cracked. This is the worst service ever! I
need a replacement or my money back immediately. On a side note, I do want
to say that your chat agent yesterday was very kind and polite to me. That
person did a great job trying to help, even though this delivery is a huge
mess. Please fix this fast.`;

    const result = analyzeWithVader(text);

    // With sentence-level analysis, VADER should detect the strongly negative
    // sentences ("worst service ever!", "extremely upset") and use those
    // as the driver, NOT the averaged overall score
    expect(result.sentimentScore).toBeLessThan(0);
    expect([Sentiment.ANGRY, Sentiment.FRUSTRATED]).toContain(result.sentiment);
  });

  it('detects clearly positive sentiment', () => {
    const text =
      'I absolutely love your product! Great customer service, very helpful team. Thank you so much!';
    const result = analyzeWithVader(text);

    expect(result.sentimentScore).toBeGreaterThan(0.3);
    expect(result.sentiment).toBe(Sentiment.POSITIVE);
  });

  it('detects neutral/mildly positive sentiment for simple inquiries', () => {
    const text = 'I would like to know the business hours for your support center.';
    const result = analyzeWithVader(text);

    // Simple inquiry — VADER may score slightly positive due to "like" and "support"
    // but should not be strongly negative
    expect(result.sentimentScore).toBeGreaterThan(-0.3);
  });

  it('detects ALL CAPS anger emphasis', () => {
    const text = 'THIS IS ABSOLUTELY TERRIBLE! My order has been LOST and NO ONE is helping me!!!';
    const result = analyzeWithVader(text);

    expect(result.sentimentScore).toBeLessThan(-0.5);
    expect(result.sentiment).toBe(Sentiment.ANGRY);
    expect(result.confidence).toBe('HIGH');
  });

  it('handles negation correctly', () => {
    const text = 'The product is not good. It does not work as expected and I am not happy.';
    const result = analyzeWithVader(text);

    expect(result.sentimentScore).toBeLessThan(0);
  });

  it('detects frustrated tone from repeated issues', () => {
    const text =
      'I have contacted support three times about this issue. Each time I am told it will be fixed but nothing changes. I am getting tired of this.';
    const result = analyzeWithVader(text);

    expect(result.sentimentScore).toBeLessThan(0);
    expect([Sentiment.ANGRY, Sentiment.FRUSTRATED, Sentiment.CONFUSED]).toContain(result.sentiment);
  });

  it('reconciles LLM vs VADER — VADER overrides when LLM is too lenient', () => {
    // Simulate: LLM said NEUTRAL (fooled by polite side-note)
    // but VADER correctly detected ANGRY with HIGH confidence
    const vaderResult = {
      scores: { neg: 0.35, neu: 0.5, pos: 0.15, compound: -0.72 },
      sentiment: Sentiment.ANGRY,
      sentimentScore: -0.72,
      confidence: 'HIGH' as const,
    };

    const reconciled = reconcileSentiment(Sentiment.NEUTRAL, 0.1, vaderResult);

    expect(reconciled.sentiment).toBe(Sentiment.ANGRY);
    expect(reconciled.sentimentScore).toBe(-0.72);
    expect(reconciled.source).toBe('VADER');
  });

  it('reconciles LLM vs VADER — trusts LLM when it is already negative enough', () => {
    const vaderResult = {
      scores: { neg: 0.2, neu: 0.6, pos: 0.2, compound: -0.4 },
      sentiment: Sentiment.FRUSTRATED,
      sentimentScore: -0.4,
      confidence: 'MEDIUM' as const,
    };

    const reconciled = reconcileSentiment(Sentiment.ANGRY, -0.85, vaderResult);

    // LLM already more severe — keep LLM
    expect(reconciled.sentiment).toBe(Sentiment.ANGRY);
    expect(reconciled.sentimentScore).toBe(-0.85);
    expect(reconciled.source).toBe('LLM');
  });

  it('reconciles LLM vs VADER — blends when VADER has medium confidence', () => {
    const vaderResult = {
      scores: { neg: 0.25, neu: 0.55, pos: 0.2, compound: -0.5 },
      sentiment: Sentiment.FRUSTRATED,
      sentimentScore: -0.5,
      confidence: 'MEDIUM' as const,
    };

    // LLM said NEUTRAL but VADER says FRUSTRATED with medium confidence
    const reconciled = reconcileSentiment(Sentiment.NEUTRAL, 0.0, vaderResult);

    // Should blend: use VADER's sentiment label but average the scores
    expect(reconciled.sentiment).toBe(Sentiment.FRUSTRATED);
    expect(reconciled.source).toBe('BLENDED');
    expect(reconciled.sentimentScore).toBe(-0.25); // average of 0.0 and -0.5
  });
});
