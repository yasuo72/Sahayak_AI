import { CustomerTier, Priority, Sentiment } from '../../generated/prisma/client.js';

export interface ScoreTicketParams {
  sentiment: Sentiment;
  sentimentScore: number; // -1.0 to 1.0
  urgencyKeywords: string[];
  category?: string | null;
  customerTier?: CustomerTier | null;
  previousCustomerReplies?: Array<{
    sentiment?: Sentiment | null;
    sentimentScore?: number | null;
  }>;
}

export interface PriorityScoreResult {
  autoPriority: Priority;
  aiReasoning: string;
  isEscalating: boolean;
  totalScore: number;
}

const HIGH_RISK_KEYWORDS = new Set([
  'urgent',
  'asap',
  'down',
  'outage',
  'emergency',
  'refund',
  'replacement',
  'money back',
  'cracked',
  'damaged',
  'defective',
  'cancel',
  'cancellation',
  'lawyer',
  'legal',
  'overcharged',
  'broken',
  'critical',
  'worst',
  'terrible',
  'immediately',
  'fast',
  'failed',
]);

export function calculateAutoPriority(params: ScoreTicketParams): PriorityScoreResult {
  const {
    sentiment,
    sentimentScore,
    urgencyKeywords = [],
    category = 'General',
    customerTier = CustomerTier.STANDARD,
    previousCustomerReplies = [],
  } = params;

  let totalScore = 0;
  const reasoningParts: string[] = [];

  // 1. Sentiment Severity Base
  if (sentiment === Sentiment.ANGRY || sentimentScore <= -0.6) {
    totalScore += 40;
    reasoningParts.push(`angry tone (${sentimentScore.toFixed(2)})`);
  } else if (sentiment === Sentiment.FRUSTRATED || sentimentScore <= -0.2) {
    totalScore += 20;
    reasoningParts.push(`frustrated tone (${sentimentScore.toFixed(2)})`);
  } else if (sentiment === Sentiment.CONFUSED) {
    totalScore += 10;
    reasoningParts.push('confused tone');
  } else if (sentiment === Sentiment.POSITIVE) {
    totalScore += 0;
    reasoningParts.push('positive tone');
  } else {
    totalScore += 5;
    reasoningParts.push('neutral tone');
  }

  // 2. Urgency Keywords
  const matchedKeywords = urgencyKeywords.filter((kw) =>
    HIGH_RISK_KEYWORDS.has(kw.toLowerCase().trim()),
  );
  if (matchedKeywords.length > 0) {
    const keywordBonus = Math.min(matchedKeywords.length * 20, 45);
    totalScore += keywordBonus;
    reasoningParts.push(
      `${matchedKeywords.length} urgency ${matchedKeywords.length === 1 ? 'keyword' : 'keywords'} (${matchedKeywords.join(', ')})`,
    );
  } else if (urgencyKeywords.length > 0) {
    totalScore += 10;
    reasoningParts.push(`urgency keywords (${urgencyKeywords.slice(0, 2).join(', ')})`);
  }

  // 3. Customer Tier Weight
  if (customerTier === CustomerTier.ENTERPRISE) {
    totalScore += 25;
    reasoningParts.push('Enterprise tier');
  } else if (customerTier === CustomerTier.PRO) {
    totalScore += 15;
    reasoningParts.push('Pro tier');
  }

  // 4. Category-Specific Risk Matrix
  const normalizedCategory = (category || 'General').trim();
  const isNegative = sentiment === Sentiment.ANGRY || sentiment === Sentiment.FRUSTRATED || sentimentScore < -0.2;

  if (isNegative && normalizedCategory === 'Billing') {
    totalScore += 25;
    reasoningParts.push('Billing refund/churn risk');
  } else if (isNegative && normalizedCategory === 'Technical') {
    totalScore += 20;
    reasoningParts.push('Technical failure risk');
  }

  // 5. Multi-reply Sentiment Trend & Escalation
  let isEscalating = false;
  if (previousCustomerReplies.length > 0) {
    const validPrevScores = previousCustomerReplies
      .map((r) => r.sentimentScore)
      .filter((s): s is number => typeof s === 'number');

    if (validPrevScores.length > 0) {
      const firstScore = validPrevScores[0];
      const prevScore = validPrevScores[validPrevScores.length - 1];

      // If sentiment worsened significantly (score drop >= 0.4) or consecutive negative messages
      const scoreDrop = prevScore - sentimentScore;
      const totalDrop = firstScore - sentimentScore;

      if (scoreDrop >= 0.4 || totalDrop >= 0.5 || (isNegative && prevScore < -0.2)) {
        isEscalating = true;
        totalScore += 30;
        reasoningParts.push(`escalating thread tone (${prevScore.toFixed(2)} → ${sentimentScore.toFixed(2)})`);
      }
    }
  }

  // Map Total Score to AutoPriority Enum
  let autoPriority: Priority = Priority.LOW;
  if (totalScore >= 65) {
    autoPriority = Priority.URGENT;
  } else if (totalScore >= 45) {
    autoPriority = Priority.HIGH;
  } else if (totalScore >= 25) {
    autoPriority = Priority.MEDIUM;
  }

  const aiReasoning = `Flagged ${autoPriority}: ${reasoningParts.join(' + ')}`;

  return {
    autoPriority,
    aiReasoning,
    isEscalating,
    totalScore,
  };
}
