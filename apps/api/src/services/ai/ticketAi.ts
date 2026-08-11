import {
  CustomerTier,
  Priority,
  Role,
  Sentiment,
  TicketStatus,
} from '../../generated/prisma/client.js';
import { prisma } from '../../lib/prisma.js';
import { sendTicketReplyEmail } from '../email/emailService.js';
import { getAiProvider } from './provider.js';
import { calculateAutoPriority } from './sentimentScoring.js';
import { analyzeWithVader, reconcileSentiment } from './vaderSentiment.js';

type ClassificationResult = {
  category: string;
  priority: Priority;
  autoResolvable: boolean;
  autoReply: string | null;
};

const allowedCategories = new Set(['Billing', 'Technical', 'Account', 'General', 'Other']);
const allowedPriorities = new Set(Object.values(Priority));
const allowedSentiments = new Set(Object.values(Sentiment));

export type AnalysisResult = {
  summary: string;
  category: string;
  priority: Priority;
  sentiment: Sentiment;
  sentimentScore: number;
  urgencyKeywords: string[];
  autoResolvable: boolean;
  autoReply: string | null;
};

function fallbackTicketAnalysis(subject: string, description: string): AnalysisResult {
  const combined = `${subject} ${description}`.toLowerCase();

  let category = 'General';
  let priority: Priority = Priority.MEDIUM;
  let sentiment: Sentiment = Sentiment.NEUTRAL;
  let sentimentScore = 0.0;
  const urgencyKeywords: string[] = [];
  let autoResolvable = false;
  let autoReply = `Thank you for reaching out to support regarding "${subject}". Our support team has received your ticket and will investigate shortly.`;

  // Keyword extraction for sentiment & urgency
  if (
    combined.includes('angry') ||
    combined.includes('terrible') ||
    combined.includes('worst') ||
    combined.includes('lawyer') ||
    combined.includes('unacceptable') ||
    combined.includes('extremely upset') ||
    combined.includes('cracked') ||
    combined.includes('money back')
  ) {
    sentiment = Sentiment.ANGRY;
    sentimentScore = -0.85;
  } else if (
    combined.includes('frustrated') ||
    combined.includes('broken') ||
    combined.includes('annoyed') ||
    combined.includes('fail') ||
    combined.includes('stuck') ||
    combined.includes('damaged')
  ) {
    sentiment = Sentiment.FRUSTRATED;
    sentimentScore = -0.5;
  } else if (
    combined.includes('confused') ||
    combined.includes('how to') ||
    combined.includes("don't understand") ||
    combined.includes('where is')
  ) {
    sentiment = Sentiment.CONFUSED;
    sentimentScore = -0.1;
  } else if (
    combined.includes('great') ||
    combined.includes('love') ||
    combined.includes('awesome')
  ) {
    sentiment = Sentiment.POSITIVE;
    sentimentScore = 0.7;
  }

  const potentialUrgentKw = [
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
    'lawyer',
    'overcharged',
    'critical',
    'worst',
    'immediately',
    'fast',
  ];
  for (const kw of potentialUrgentKw) {
    if (combined.includes(kw)) {
      urgencyKeywords.push(kw);
    }
  }

  if (
    combined.includes('password') ||
    combined.includes('reset') ||
    combined.includes('login') ||
    combined.includes('sign in') ||
    combined.includes('forgot')
  ) {
    category = 'Account';
    priority = Priority.LOW;
    autoResolvable = true;
    autoReply =
      'You can easily reset your password from the sign-in page by selecting "Forgot Password" and entering your email address to receive reset instructions.';
  } else if (
    combined.includes('bill') ||
    combined.includes('invoice') ||
    combined.includes('payment') ||
    combined.includes('charge') ||
    combined.includes('refund')
  ) {
    category = 'Billing';
    priority = Priority.HIGH;
    autoReply =
      'Thank you for contacting billing support. We have received your inquiry regarding billing/payments and our financial support team is reviewing your account details.';
  } else if (
    combined.includes('bug') ||
    combined.includes('error') ||
    combined.includes('broken') ||
    combined.includes('crash') ||
    combined.includes('failed') ||
    combined.includes('issue')
  ) {
    category = 'Technical';
    priority = Priority.HIGH;
    autoReply =
      'Thank you for reporting this technical issue. Our engineering team has logged the report and is actively looking into it.';
  } else if (
    combined.includes('urgent') ||
    combined.includes('down') ||
    combined.includes('emergency') ||
    combined.includes('outage')
  ) {
    priority = Priority.URGENT;
    autoReply =
      'This urgent request has been flagged with highest priority for immediate review by our technical team.';
  }

  const summary = `Customer request regarding ${subject.trim() || 'support'}.`;

  // Even in fallback mode, run VADER for better accuracy than keyword matching
  const vaderResult = analyzeWithVader(`${subject} ${description}`);
  const reconciled = reconcileSentiment(sentiment, sentimentScore, vaderResult);

  console.log(
    `[Sentiment/Fallback] Keywords: ${sentiment}(${sentimentScore}) | VADER: ${vaderResult.sentiment}(${vaderResult.sentimentScore}, ${vaderResult.confidence}) | Final: ${reconciled.sentiment}(${reconciled.sentimentScore}) via ${reconciled.source}`,
  );

  return {
    summary,
    category,
    priority,
    sentiment: reconciled.sentiment,
    sentimentScore: reconciled.sentimentScore,
    urgencyKeywords,
    autoResolvable,
    autoReply,
  };
}

export async function analyzeTicketWithAi(
  subject: string,
  description: string,
): Promise<AnalysisResult> {
  try {
    const prompt = `ANALYZE_TICKET
Analyze this customer support ticket and provide a comprehensive analysis including emotional tone and priority scoring.

Return only valid JSON with this shape:
{
  "summary": "1-2 sentence concise summary of the issue for an agent queue",
  "category": "Billing" | "Technical" | "Account" | "General" | "Other",
  "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
  "sentiment": "ANGRY" | "FRUSTRATED" | "NEUTRAL" | "CONFUSED" | "POSITIVE",
  "sentimentScore": number between -1.0 (extremely negative/angry) and 1.0 (extremely positive),
  "urgencyKeywords": ["array", "of", "phrases", "signaling", "urgency", "or", "risk"],
  "autoResolvable": boolean,
  "autoReply": "Clear, helpful customer response addressing their issue"
}

Provide a helpful, polite customer response in "autoReply" for ALL support requests.
Only set autoResolvable true for simple, low-risk requests like password reset instructions, simple login help, or business hours. For complex billing, technical bugs, or custom questions, set autoResolvable false so human agents can review while the customer receives your helpful initial response.

IMPORTANT SENTIMENT RULE:
If the customer expresses strong anger, outrage, or severe dissatisfaction about a broken/damaged product, failed delivery, overcharge, or poor service (e.g., "extremely upset", "worst service ever", "cracked screen", "money back immediately", "demand a refund"), classify sentiment as "ANGRY" with sentimentScore <= -0.8 and extract urgency phrases (e.g. ["cracked screen", "money back immediately", "worst service"]).
Do NOT lower the anger rating or score the message as POSITIVE/NEUTRAL just because the customer included polite side-notes, thanks, or compliments to individual support agents.

Subject: ${subject}
Description: ${description}`;

    const text = await getAiProvider().generateText(prompt, {
      temperature: 0.1,
      responseMimeType: 'application/json',
    });
    const parsed = parseJsonObject(text);

    const summary =
      typeof parsed.summary === 'string' && parsed.summary.trim()
        ? parsed.summary.trim()
        : `Ticket regarding ${subject}`;
    const category = typeof parsed.category === 'string' ? parsed.category : 'Other';
    const priority = typeof parsed.priority === 'string' ? parsed.priority : Priority.MEDIUM;
    const sentimentStr =
      typeof parsed.sentiment === 'string' ? parsed.sentiment.toUpperCase() : 'NEUTRAL';
    const sentiment = allowedSentiments.has(sentimentStr as Sentiment)
      ? (sentimentStr as Sentiment)
      : Sentiment.NEUTRAL;

    let sentimentScore = typeof parsed.sentimentScore === 'number' ? parsed.sentimentScore : 0.0;
    if (isNaN(sentimentScore)) sentimentScore = 0.0;
    sentimentScore = Math.max(-1.0, Math.min(1.0, sentimentScore));

    const urgencyKeywords = Array.isArray(parsed.urgencyKeywords)
      ? parsed.urgencyKeywords.filter(
          (kw): kw is string => typeof kw === 'string' && kw.trim().length > 0,
        )
      : [];

    const autoReply =
      typeof parsed.autoReply === 'string' && parsed.autoReply.trim()
        ? parsed.autoReply.trim()
        : `Thank you for contacting support regarding "${subject}". We have received your request and are reviewing it.`;

    // Run VADER locally as a validation layer (~1-2ms, zero API cost)
    const vaderResult = analyzeWithVader(`${subject} ${description}`);
    const reconciled = reconcileSentiment(sentiment, sentimentScore, vaderResult);

    console.log(
      `[Sentiment] LLM: ${sentiment}(${sentimentScore}) | VADER: ${vaderResult.sentiment}(${vaderResult.sentimentScore}, ${vaderResult.confidence}) | Final: ${reconciled.sentiment}(${reconciled.sentimentScore}) via ${reconciled.source}`,
    );

    return {
      summary,
      category: allowedCategories.has(category) ? category : 'Other',
      priority: allowedPriorities.has(priority as Priority)
        ? (priority as Priority)
        : Priority.MEDIUM,
      sentiment: reconciled.sentiment,
      sentimentScore: reconciled.sentimentScore,
      urgencyKeywords,
      autoResolvable: parsed.autoResolvable === true,
      autoReply,
    };
  } catch (error) {
    console.warn(
      'AI API quota limit hit or failed, using Smart Fallback engine:',
      error instanceof Error ? error.message : error,
    );
    return fallbackTicketAnalysis(subject, description);
  }
}

export async function summarizeTicket(subject: string, description: string) {
  const analysis = await analyzeTicketWithAi(subject, description);
  return analysis.summary;
}

export async function classifyTicket(
  subject: string,
  description: string,
): Promise<ClassificationResult> {
  const analysis = await analyzeTicketWithAi(subject, description);
  return {
    category: analysis.category,
    priority: analysis.priority,
    autoResolvable: analysis.autoResolvable,
    autoReply: analysis.autoReply,
  };
}

export async function polishReply(draft: string) {
  try {
    const prompt = `POLISH_REPLY
Rewrite this support-agent reply to be clearer, warmer, and more professional.
Keep the meaning the same. Do not add promises, discounts, policies, or facts that are not present.

Draft:
${draft}`;

    return await getAiProvider().generateText(prompt, {
      temperature: 0.3,
    });
  } catch (error) {
    console.warn(
      'AI API call failed during polishReply, applying fallback polish:',
      error instanceof Error ? error.message : error,
    );
    return fallbackPolishReply(draft);
  }
}

function fallbackPolishReply(draft: string): string {
  const trimmed = draft.trim();
  if (!trimmed) return draft;

  let polished = trimmed;
  if (!/^(hello|hi|dear|thanks)/i.test(polished)) {
    polished = `Hello,\n\n${polished}`;
  }
  if (!/(thanks|regards|support|team)/i.test(polished)) {
    polished = `${polished}\n\nBest regards,\nSupport Team`;
  }
  return polished;
}

export async function enrichTicketWithAi(ticketId: string, subject: string, description: string) {
  try {
    const existingTicket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        customer: true,
        replies: {
          where: { isInternal: false },
          include: { author: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    const analysis = await analyzeTicketWithAi(subject, description);
    const aiUser = await ensureAiAssistantUser();

    // Gather previous customer replies sentiment trend
    const customerReplies = (existingTicket?.replies ?? [])
      .filter((r) => r.author.role === Role.CUSTOMER)
      .map((r) => ({
        sentiment: r.sentiment,
        sentimentScore: r.sentimentScore,
      }));

    const scoring = calculateAutoPriority({
      sentiment: analysis.sentiment,
      sentimentScore: analysis.sentimentScore,
      urgencyKeywords: analysis.urgencyKeywords,
      category: analysis.category,
      customerTier: existingTicket?.customer?.tier ?? CustomerTier.STANDARD,
      previousCustomerReplies: customerReplies,
    });

    console.log(
      `\n🎯 [AI ENRICHMENT] Ticket: "${subject}"\n` +
        `   LLM → sentiment: ${analysis.sentiment}(${analysis.sentimentScore}), priority: ${analysis.priority}, keywords: [${analysis.urgencyKeywords.join(', ')}]\n` +
        `   Scoring → ${scoring.aiReasoning} (score: ${scoring.totalScore})\n` +
        `   ✅ WRITING priority=${scoring.autoPriority} to DB\n`,
    );

    const replyBody = `${analysis.autoReply}\n\nThis response was generated by AI Support. Reply to this email if you need further help.`;

    let customerEmailToNotify: string | null = null;

    await prisma.$transaction(async (tx) => {
      const updated = await tx.ticket.update({
        where: {
          id: ticketId,
        },
        data: {
          aiSummary: analysis.summary,
          category: analysis.category,
          priority: scoring.autoPriority,
          aiSuggestedPriority: analysis.priority,
          sentiment: analysis.sentiment,
          sentimentScore: analysis.sentimentScore,
          urgencyKeywords: analysis.urgencyKeywords,
          autoPriority: scoring.autoPriority,
          aiReasoning: scoring.aiReasoning,
          status: analysis.autoResolvable ? TicketStatus.AUTO_RESOLVED : undefined,
          resolvedAt: analysis.autoResolvable ? new Date() : undefined,
        },
        include: {
          customer: true,
        },
      });

      customerEmailToNotify = updated.customer.email;

      await tx.reply.create({
        data: {
          ticketId,
          authorId: aiUser.id,
          body: replyBody,
          sentiment: analysis.sentiment,
          sentimentScore: analysis.sentimentScore,
        },
      });
      await tx.auditEvent.create({
        data: {
          ticketId,
          actorId: aiUser.id,
          action: analysis.autoResolvable ? 'ticket.auto_resolved' : 'ticket.ai_responded',
          fromValue: TicketStatus.OPEN,
          toValue: analysis.autoResolvable ? TicketStatus.AUTO_RESOLVED : TicketStatus.OPEN,
        },
      });
    });

    if (customerEmailToNotify) {
      void sendTicketReplyEmail({
        customerEmail: customerEmailToNotify,
        ticketSubject: subject,
        replyBody,
      });
    }

    return loadTicketWithRelations(ticketId);
  } catch (error) {
    console.warn('AI enrichment skipped:', error instanceof Error ? error.message : error);
    return null;
  }
}

export async function ensureAiAssistantUser() {
  const email = 'ai-assistant@aiticketing.local';
  const existing = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.user.create({
    data: {
      email,
      name: 'AI Support Assistant',
      passwordHash: 'system-user-no-login',
      role: Role.AGENT,
      isActive: false,
    },
  });
}

async function loadTicketWithRelations(ticketId: string) {
  return prisma.ticket.findUnique({
    where: {
      id: ticketId,
    },
    include: {
      customer: true,
      agent: true,
      replies: {
        where: {
          isInternal: false,
        },
        orderBy: {
          createdAt: 'asc',
        },
        include: {
          author: true,
        },
      },
      auditEvents: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });
}

function parseJsonObject(text: string) {
  const trimmed = text.trim();
  const jsonText = trimmed.startsWith('{')
    ? trimmed
    : (trimmed.match(/```json\s*([\s\S]*?)```/)?.[1] ?? trimmed.match(/\{[\s\S]*\}/)?.[0]);

  if (!jsonText) {
    return {};
  }

  try {
    return JSON.parse(jsonText) as Record<string, unknown>;
  } catch {
    return {};
  }
}
