/**
 * VADER Sentiment Analysis — Local NLP Validation Layer
 *
 * VADER (Valence Aware Dictionary and sEntiment Reasoner) is a rule-based
 * sentiment engine specifically designed for customer-facing text. It handles:
 *   - ALL CAPS emphasis ("THIS IS TERRIBLE")
 *   - Punctuation intensity ("worst service ever!!!")
 *   - Negation ("not good", "never works")
 *   - Degree modifiers ("extremely upset", "slightly annoyed")
 *   - Conjunctions that shift sentiment ("good service but broken product")
 *
 * Used as a validation layer: if VADER strongly disagrees with the LLM's
 * sentiment classification, the more negative/urgent result wins.
 */

import { Sentiment } from '../../generated/prisma/client.js';

// vader-sentiment ships as CJS; use createRequire for ESM compatibility
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const vader = require('vader-sentiment') as {
  SentimentIntensityAnalyzer: {
    polarity_scores: (text: string) => VaderScores;
  };
};

export interface VaderScores {
  /** Proportion of text that is negative (0–1) */
  neg: number;
  /** Proportion of text that is neutral (0–1) */
  neu: number;
  /** Proportion of text that is positive (0–1) */
  pos: number;
  /** Normalized compound score (-1 to +1) */
  compound: number;
}

export interface VaderAnalysis {
  scores: VaderScores;
  sentiment: Sentiment;
  sentimentScore: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * Analyze text with VADER using sentence-level decomposition.
 *
 * Why sentence-level? VADER's compound score averages sentiment across the
 * entire text. In mixed-sentiment emails like:
 *   "This is the WORST service ever! ... your chat agent was very kind."
 * the polite sentences dilute the anger, producing a misleadingly positive
 * overall score. By scoring each sentence individually, we can detect the
 * MOST NEGATIVE sentence and use it to drive classification.
 *
 * Runs locally in ~1-2ms, zero API cost.
 */
export function analyzeWithVader(text: string): VaderAnalysis {
  // Score the full text for the overall compound
  const overallScores = vader.SentimentIntensityAnalyzer.polarity_scores(text);

  // Split into sentences and score each one
  const sentences = splitIntoSentences(text);
  const sentenceScores = sentences.map((s) => ({
    text: s,
    scores: vader.SentimentIntensityAnalyzer.polarity_scores(s),
  }));

  // Find the most negative sentence
  const mostNegative = sentenceScores.reduce(
    (worst, current) => (current.scores.compound < worst.scores.compound ? current : worst),
    sentenceScores[0] ?? { text: '', scores: overallScores },
  );

  // Find the most positive sentence
  const mostPositive = sentenceScores.reduce(
    (best, current) => (current.scores.compound > best.scores.compound ? current : best),
    sentenceScores[0] ?? { text: '', scores: overallScores },
  );

  // Decision: use the most negative sentence if it's strongly negative,
  // even if the overall text averages out to positive/neutral.
  // This is the "dominant anger" heuristic for customer support.
  const hasStrongNegative = mostNegative.scores.compound <= -0.4;
  const negativeRatio =
    sentenceScores.filter((s) => s.scores.compound <= -0.2).length / Math.max(sentenceScores.length, 1);

  let effectiveScores: VaderScores;

  if (hasStrongNegative && negativeRatio >= 0.2) {
    // Strong anger detected in at least one sentence + at least 20% of sentences are negative
    // → Use the most negative sentence's score as the driver
    effectiveScores = mostNegative.scores;
  } else if (hasStrongNegative && mostPositive.scores.compound > 0.5) {
    // Mixed: one angry sentence + one very positive sentence
    // → Blend: weight the negative sentence more heavily (60/40 anger bias)
    effectiveScores = {
      neg: mostNegative.scores.neg * 0.6 + overallScores.neg * 0.4,
      neu: overallScores.neu,
      pos: mostNegative.scores.pos * 0.6 + overallScores.pos * 0.4,
      compound: mostNegative.scores.compound * 0.6 + overallScores.compound * 0.4,
    };
  } else {
    // No strong negativity → use overall compound (VADER default behavior)
    effectiveScores = overallScores;
  }

  const sentiment = mapCompoundToSentiment(effectiveScores);
  const sentimentScore = Math.round(effectiveScores.compound * 100) / 100;

  // Confidence is based on how decisive the effective scores are
  const dominantProportion = Math.max(effectiveScores.neg, effectiveScores.pos);
  const confidence: VaderAnalysis['confidence'] =
    dominantProportion >= 0.3 ? 'HIGH' : dominantProportion >= 0.15 ? 'MEDIUM' : 'LOW';

  return { scores: effectiveScores, sentiment, sentimentScore, confidence };
}

/**
 * Split text into sentences using punctuation boundaries.
 * Handles: periods, exclamation marks, question marks, and newlines.
 */
function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3); // Skip empty fragments
}

/**
 * Map VADER compound score to our Sentiment enum.
 *
 * Thresholds tuned for customer support text:
 *   compound <= -0.6  → ANGRY
 *   compound <= -0.2  → FRUSTRATED
 *   compound >= 0.3   → POSITIVE
 *   |compound| < 0.15 → NEUTRAL
 *   remaining negative → CONFUSED (borderline negative, unclear intent)
 */
function mapCompoundToSentiment(scores: VaderScores): Sentiment {
  const { compound, neg } = scores;

  if (compound <= -0.6 || (compound <= -0.4 && neg >= 0.3)) {
    return Sentiment.ANGRY;
  }
  if (compound <= -0.2) {
    return Sentiment.FRUSTRATED;
  }
  if (compound >= 0.3) {
    return Sentiment.POSITIVE;
  }
  if (compound > -0.15 && compound < 0.15) {
    return Sentiment.NEUTRAL;
  }
  // Mildly negative — could be confused or mildly frustrated
  return Sentiment.CONFUSED;
}

/**
 * Reconcile the LLM's sentiment analysis with VADER's local analysis.
 *
 * Strategy: "Most-Negative Wins" — if VADER detects significantly more
 * negative sentiment than the LLM, we escalate to VADER's classification.
 * This prevents the LLM from being "too polite" and averaging out anger
 * when customers include polite side-notes.
 *
 * Returns the reconciled sentiment and score.
 */
export function reconcileSentiment(
  llmSentiment: Sentiment,
  llmScore: number,
  vaderResult: VaderAnalysis,
): { sentiment: Sentiment; sentimentScore: number; source: 'LLM' | 'VADER' | 'BLENDED' } {
  const severityOrder: Record<Sentiment, number> = {
    [Sentiment.ANGRY]: 4,
    [Sentiment.FRUSTRATED]: 3,
    [Sentiment.CONFUSED]: 2,
    [Sentiment.NEUTRAL]: 1,
    [Sentiment.POSITIVE]: 0,
  };

  const llmSeverity = severityOrder[llmSentiment];
  const vaderSeverity = severityOrder[vaderResult.sentiment];

  // Case 1: VADER is significantly more negative AND has high confidence
  // → Override the LLM (prevents "compliment dilution" issue)
  if (vaderSeverity > llmSeverity && vaderResult.confidence === 'HIGH') {
    return {
      sentiment: vaderResult.sentiment,
      sentimentScore: vaderResult.sentimentScore,
      source: 'VADER',
    };
  }

  // Case 2: VADER agrees with LLM or is less negative
  // → Trust the LLM (it has better contextual understanding)
  if (vaderSeverity <= llmSeverity) {
    return {
      sentiment: llmSentiment,
      sentimentScore: llmScore,
      source: 'LLM',
    };
  }

  // Case 3: VADER is more negative but only medium confidence
  // → Blend: use the more negative sentiment label but average the scores
  const blendedScore = Math.round(((llmScore + vaderResult.sentimentScore) / 2) * 100) / 100;
  return {
    sentiment: vaderResult.sentiment,
    sentimentScore: blendedScore,
    source: 'BLENDED',
  };
}
