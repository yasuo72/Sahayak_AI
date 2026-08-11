# 🚀 Sahayak AI — Next-Gen AI Support Ecosystem

<div align="center">

  <img src="docs/images/hero-banner.jpg" alt="Smart Ticketing Hero Banner" width="100%" style="border-radius: 16px; margin-bottom: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);" />

  <img src="https://img.shields.io/badge/Status-Production%20Ready-emerald?style=for-the-badge&logo=rocket" alt="Status" />
  <img src="https://img.shields.io/badge/Frontend-Vercel%20%7C%20React%2019%20%7C%20Vite-blue?style=for-the-badge&logo=vercel" alt="Frontend" />
  <img src="https://img.shields.io/badge/Backend-Railway%20%7C%20Node.js%20%7C%20Express-purple?style=for-the-badge&logo=railway" alt="Backend" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL%20%7C%20Prisma%20ORM-336791?style=for-the-badge&logo=postgresql" alt="Database" />
  <img src="https://img.shields.io/badge/AI%20Engine-LLM%20%7C%20Groq%20%7C%20Llama%203.3-orange?style=for-the-badge&logo=openai" alt="AI Engine" />
  <img src="https://img.shields.io/badge/NLP-VADER%20Sentiment-red?style=for-the-badge&logo=python" alt="NLP" />
  <img src="https://img.shields.io/badge/Email-Resend%20API-black?style=for-the-badge&logo=resend" alt="Email" />

  <p align="center">
    <b>A high-performance, autonomous, AI-driven customer support and ticket management system.</b><br />
    Designed for lightning-fast resolution, real-time analytics, AI sentiment analysis, two-way email synchronization, and mobile-first responsiveness.
  </p>

</div>

---

## 📖 Quick Project Summary

**Smart Ticketing** is a full-stack AI-powered customer support platform built as a monorepo with two apps:

| Component | Stack | Purpose |
|-----------|-------|---------|
| **`apps/web`** | React 19 + Vite + Tailwind CSS v4 | Customer portal & Agent workspace UI |
| **`apps/api`** | Node.js + Express + Prisma + PostgreSQL | REST API, AI engine, email webhooks |

### What It Does (30-Second Summary)

1. **Customers** submit support tickets via the web portal or by sending an email.
2. **AI (Groq/Llama 3.3)** instantly analyzes the ticket — categorizes it, writes a summary, generates an auto-reply, and performs **sentiment analysis** to detect customer emotion.
3. **VADER NLP** (local, zero-cost) validates the AI's sentiment classification sentence-by-sentence, preventing the LLM from being "too polite" on mixed-emotion emails.
4. A **multi-factor priority scoring engine** combines sentiment severity + urgency keywords + customer tier + category risk to auto-assign priority (LOW → URGENT).
5. **Support agents** view tickets in a real-time workspace with chat threads, internal notes, AI reply polishing, and fullscreen focus mode.
6. **Two-way email sync**: customer email replies appear in the agent workspace; agent replies are delivered back via email.

### Key Numbers

- **44 unit/integration tests** passing (Vitest) + Playwright E2E suite
- **3-layer AI pipeline**: LLM → VADER → Priority Scoring
- **~2ms** local VADER analysis per ticket (zero API cost)
- **5 sentiment classes**: ANGRY, FRUSTRATED, NEUTRAL, CONFUSED, POSITIVE
- **4 priority levels**: LOW, MEDIUM, HIGH, URGENT

---

## 📸 Live Application Showcase & Interface Tour

Experience the clean, modern interface and powerful workflows built into **Smart Ticketing**:

### 📊 1. Real-Time Analytics & Operational Dashboard

> _Live-updating metrics tracking open tickets, resolution distribution, priority breakdown, category counts, and system activity._

<div align="center">
  <img src="docs/images/admin_dash.png" alt="Admin Operational Dashboard" width="100%" style="border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 8px 24px rgba(0,0,0,0.08);" />
</div>

<br />

### 💬 2. Smart Ticket Creation & Workspace Chat

> _Submitting support tickets with mandatory email notification confirmation alongside the unified multi-pane chat workspace for agents and customers._

<table width="100%">
  <tr>
    <td width="50%" align="center">
      <b>📝 Customer Ticket Creation Portal</b><br /><br />
      <img src="docs/images/cutomer_ticketgen.png" alt="Customer Ticket Creation" width="100%" style="border-radius: 10px; border: 1px solid #e2e8f0;" />
      <p><i>Form with mandatory email notification & priority selection</i></p>
    </td>
    <td width="50%" align="center">
      <b>🧑‍💻 Agent Ticket Workspace & Chat</b><br /><br />
      <img src="docs/images/admin_ticket.png" alt="Admin Ticket Management" width="100%" style="border-radius: 10px; border: 1px solid #e2e8f0;" />
      <p><i>Multi-panel ticket queue, status filters & thread replies</i></p>
    </td>
  </tr>
</table>

<br />

### 🤖 3. AI Ticket Summary & Auto-Resolution Engine

> _Real-time AI ticket analysis providing 1-click editable summaries, category classification, and automated reply polishing._

<div align="center">
  <img src="docs/images/ai_summ.png" alt="AI Ticket Summary" width="90%" style="border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 6px 20px rgba(0,0,0,0.06);" />
</div>

<br />

### 🛡️ 4. Admin User Management & Role Controls

> _Complete user directory management with role assignment (Customer, Agent, Admin), account search, and safe soft-deactivation._

<div align="center">
  <img src="docs/images/account_cre_admin.png" alt="Admin User Management" width="100%" style="border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 6px 20px rgba(0,0,0,0.06);" />
</div>

---

## 💡 What is Smart Ticketing? (In Simple Terms)

Imagine having a **super-intelligent, 24/7 digital support agent** on your team that never sleeps.

When a customer submits a problem—either through the web portal or by simply sending an email—**Smart Ticketing** instantly gets to work:

1. 🔍 **Understands the Problem**: It reads the message, categorizes the issue (e.g., _Billing_, _Technical_, _Account_), and assesses urgency.
2. 😠 **Reads Emotional Tone**: Using a dual-layer AI + NLP sentiment engine, it detects whether the customer is _angry_, _frustrated_, _confused_, or _positive_ — even in mixed-emotion emails with polite side-notes.
3. 🤖 **Solves Common Issues Instantly**: If a user asks a routine question (like how to reset a password), the AI auto-resolves the ticket immediately with clear, friendly instructions.
4. 🪄 **Empowers Support Staff**: For complex issues requiring human agents, the AI generates instant summaries and even rewrites rough agent notes into polished, professional replies with 1 click.
5. 📬 **Seamless Email Sync**: Customers can reply to support emails directly from Gmail, Outlook, or Apple Mail, and their messages appear instantly inside the agent's web ticket chat.
6. 🚨 **Smart Priority Escalation**: Combines sentiment severity + urgency keywords + customer tier + category-specific risk to auto-flag tickets as HIGH or URGENT when intervention is needed.

---

## 🧠 AI Sentiment Analysis & Priority Scoring Pipeline

The heart of Smart Ticketing's intelligence is a **3-layer analysis pipeline** that processes every ticket:

```
┌──────────────────────────────────────────────────────────────────────┐
│                    Customer Email / Ticket                           │
└───────────────────────────┬──────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Layer 1: LLM Analysis (Groq / Llama 3.3)              ~1-3s       │
│  ─────────────────────────────────────────────                      │
│  • Category classification (Billing/Technical/Account/General)      │
│  • 1-2 sentence summary for agent queue                             │
│  • Sentiment label (ANGRY/FRUSTRATED/NEUTRAL/CONFUSED/POSITIVE)     │
│  • Sentiment score (-1.0 to +1.0)                                   │
│  • Urgency keyword extraction                                       │
│  • Auto-reply generation                                            │
│  • Auto-resolvable detection (e.g. password reset)                  │
└───────────────────────────┬──────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Layer 2: VADER NLP Validation (Local)                  ~2ms       │
│  ─────────────────────────────────────────                          │
│  • Sentence-by-sentence decomposition                               │
│  • "Most-Negative-Wins" heuristic — prevents compliment dilution    │
│  • Handles: ALL CAPS, punctuation (!!!), negation, degree modifiers │
│  • reconcileSentiment(): if VADER detects stronger anger than       │
│    the LLM, VADER overrides; otherwise trusts the LLM              │
│  • Zero API cost, runs entirely locally via vader-sentiment npm     │
└───────────────────────────┬──────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Layer 3: Multi-Factor Priority Scoring Engine                      │
│  ─────────────────────────────────────────                          │
│  Factor breakdown:                                                  │
│  • Sentiment severity:     ANGRY +40 | FRUSTRATED +20 | CONFUSED +10│
│  • Urgency keywords:       Up to +45 (20 per keyword, capped)       │
│  • Customer tier:          ENTERPRISE +25 | PRO +15                 │
│  • Category risk matrix:   Neg + Billing = +25 (refund/churn risk)  │
│                            Neg + Technical = +20 (failure risk)     │
│  • Thread escalation:      Worsening sentiment trend = +30          │
│  ─────────────────────────────────────────                          │
│  Score → Priority mapping:                                          │
│  • 0-24  → LOW    │  25-44 → MEDIUM                                │
│  • 45-64 → HIGH   │  65+   → URGENT                                │
└──────────────────────────────────────────────────────────────────────┘
```

### Example: Mixed-Sentiment Email

> _"I am extremely upset. The screen is cracked. This is the worst service ever! ... On a side note, your chat agent was very kind and polite."_

| Layer | Result |
|-------|--------|
| **LLM (without VADER)** | Could classify as NEUTRAL (-0.1) — diluted by polite side-note |
| **VADER sentence-level** | Finds `"worst service ever!"` at compound -0.73 → ANGRY |
| **reconcileSentiment()** | VADER overrides → **ANGRY (-0.73)** |
| **Priority Scoring** | ANGRY(+40) + 5 keywords(+45) = 85 → **URGENT** ⚡ |

---

## 🧠 AI Engine & Smart Auto-Pilot Workflow

<div align="center">
  <img src="docs/images/ai-workflow.jpg" alt="AI Smart Engine Workflow" width="100%" style="border-radius: 12px; margin-top: 10px; margin-bottom: 20px;" />
</div>

---

## 🌟 Highlights & Core Capabilities

| Feature                         | Technical Implementation                                                                                                        | Non-Tech Explanation                                                       |
| :------------------------------ | :------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------- |
| **🤖 AI Auto-Pilot**            | Analyzes sentiment, categorizes tickets, generates summaries, and auto-resolves simple support requests using Groq / Llama 3.3. | Saves 80% of routine customer support time automatically.                  |
| **😠 Dual-Layer Sentiment AI**  | LLM sentiment analysis validated by VADER NLP (sentence-level decomposition, "most-negative-wins" reconciliation).              | Catches angry customers even when they include polite side-notes.          |
| **🚨 Smart Priority Scoring**   | Multi-factor engine: sentiment severity + urgency keywords + customer tier + category risk matrix + thread escalation trend.     | Angry customer + billing issue = auto-escalate to URGENT.                  |
| **📧 Two-Way Email Sync**       | Webhook integration with Resend API for automatic inbound ticket creation and outbound email notifications.                     | Customers use email as usual; support staff use a unified web dashboard.   |
| **🪄 1-Click AI Polisher**      | Converts informal agent notes into empathetic, professionally worded customer responses via AI prompt engineering.               | No typos or awkward phrasing—always crisp, professional support.           |
| **🖥️ Fullscreen Focus Mode**   | Toggle button expands ticket detail/chat to 100% workspace width, hiding the ticket list sidebar.                               | Agents can focus on a single conversation without distractions.            |
| **🌙 Dark Mode**                | Full dark theme with CSS attribute selectors handling Tailwind opacity variants and tinted badge backgrounds.                    | Easy on the eyes for night shifts and late-night support work.             |
| **📱 Mobile-First UI**          | Custom responsive sliding drawers, mobile hamburger menus, and seamless single-pane detail views.                               | Works flawlessly on iPhones, Android devices, tablets, and desktops.       |
| **⚡ Shimmer Skeletons**        | Smooth loading states with custom animated skeleton UI placeholders preventing layout shift.                                    | Zero layout shifts or blank screens while data is loading.                 |
| **🛡️ Role-Based Security**     | Multi-tenant authorization (Customer, Agent, Admin) with audit logs and secure HTTP-only cookies.                               | Ensures customers only see their own tickets while staff manage the workspace. |

---

## 🔄 End-to-End Workflow Architecture

Here is how information flows through the system from initial customer request to final resolution:

```mermaid
flowchart TD
    %% Nodes
    User([👤 Customer])
    EmailInput[📧 Email Inbound Webhook]
    WebInput[🌐 Web Portal Form]
    API[⚡ Node.js / Express API]
    Prisma[(🗄️ PostgreSQL Database)]
    AI[🧠 AI Engine - Llama 3.3 / Groq]
    VADER[🔬 VADER NLP - Sentence Analysis]
    Scorer[📊 Priority Scoring Engine]
    Agent([🧑‍💻 Support Agent / Admin])
    EmailOut[✉️ Resend Email Service]

    %% Flow
    User -->|Sends Email| EmailInput
    User -->|Creates Ticket on Website| WebInput

    EmailInput -->|POST /api/email/inbound| API
    WebInput -->|POST /api/tickets| API

    API -->|Save Ticket| Prisma
    API -->|Trigger Async AI Enrichment| AI

    AI -->|Categorize, Summarize & Sentiment| VADER
    VADER -->|Validate & Reconcile Sentiment| Scorer
    Scorer -->|Auto-Priority (LOW→URGENT)| Prisma
    AI -->|Auto-Resolve Routine Issues| User

    API -->|Push to Workspace| Agent
    Agent -->|1-Click Polish Reply| AI
    Agent -->|Send Reply| API

    API -->|Update Ticket & Audit Log| Prisma
    API -->|Send Email Notification| EmailOut
    EmailOut -->|Delivers Email| User
```

---

## 🗃️ Database Schema Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│  User                                                               │
│  ───────                                                            │
│  id, email, passwordHash, name, role (CUSTOMER/AGENT/ADMIN),        │
│  tier (STANDARD/PRO/ENTERPRISE), isActive                           │
├─────────────────────────────────────────────────────────────────────┤
│  Ticket                                                             │
│  ───────                                                            │
│  id, subject, description, status, priority, category,              │
│  aiSummary, aiSuggestedPriority, sentiment, sentimentScore,         │
│  urgencyKeywords[], autoPriority, aiReasoning,                      │
│  customerId → User, agentId → User, notificationEmail               │
├─────────────────────────────────────────────────────────────────────┤
│  Reply                                                              │
│  ───────                                                            │
│  id, ticketId → Ticket, authorId → User, body,                     │
│  isAiDraft, isInternal, sentiment, sentimentScore                   │
├─────────────────────────────────────────────────────────────────────┤
│  AuditEvent                                                         │
│  ───────                                                            │
│  id, ticketId → Ticket, actorId → User, action, fromValue, toValue  │
└─────────────────────────────────────────────────────────────────────┘

Enums: Role | CustomerTier | Sentiment | TicketStatus | Priority
```

---

## 📁 Project Structure

```
Smart_Ticketing/
├── apps/
│   ├── api/                          # Backend REST API
│   │   ├── prisma/
│   │   │   └── schema.prisma         # Database schema (User, Ticket, Reply, AuditEvent)
│   │   └── src/
│   │       ├── routes/
│   │       │   ├── auth.ts           # Signup, login, logout, session management
│   │       │   ├── tickets.ts        # CRUD, assignment, status workflow, reply threads
│   │       │   ├── email.ts          # Inbound email webhooks (Resend, Sender)
│   │       │   ├── dashboard.ts      # Real-time analytics & metrics
│   │       │   ├── adminUsers.ts     # User management (list, update, deactivate)
│   │       │   └── ai.ts            # AI polish reply endpoint
│   │       ├── services/
│   │       │   ├── ai/
│   │       │   │   ├── ticketAi.ts           # LLM analysis, auto-reply, enrichment
│   │       │   │   ├── vaderSentiment.ts     # VADER NLP sentence-level analysis
│   │       │   │   ├── sentimentScoring.ts   # Multi-factor priority scoring engine
│   │       │   │   └── provider.ts           # AI provider abstraction (Groq/Gemini)
│   │       │   └── email/
│   │       │       └── emailService.ts       # Resend email delivery service
│   │       ├── middleware/
│   │       │   └── auth.ts           # Session auth & role-based guards
│   │       └── lib/
│   │           └── prisma.ts         # Prisma client singleton
│   │
│   └── web/                          # Frontend React SPA
│       └── src/
│           ├── components/
│           │   ├── tickets/
│           │   │   └── TicketsPage.tsx    # Ticket list + detail/chat panel + fullscreen
│           │   ├── dashboard/            # Analytics dashboard with charts
│           │   ├── settings/             # Admin user management
│           │   └── auth/                 # Login & signup forms
│           ├── lib/
│           │   └── types.ts              # Shared TypeScript interfaces
│           ├── App.tsx                   # Root layout, routing, dark mode toggle
│           └── index.css                # Global styles, dark mode overrides
│
├── docs/images/                      # Screenshots & diagrams
├── docker-compose.yml                # Local PostgreSQL via Docker
├── playwright.config.ts              # E2E test configuration
└── package.json                      # Monorepo workspace config
```

---

## 📱 Multi-Device Experience & Responsiveness

<div align="center">
  <img src="docs/images/responsive-devices.jpg" alt="Multi-Device Responsive Experience" width="100%" style="border-radius: 12px; margin-top: 10px; margin-bottom: 20px;" />
</div>

The web application is engineered for multi-device perfection across laptops, tablets, and phones:

```
  ┌─────────────────────────────────────────────────────────────────┐
  │                        DESKTOP VIEW (>768px)                    │
  ├──────────────┬───────────────────┬──────────────────────────────┤
  │   SIDEBAR    │   TICKET LIST     │     TICKET DETAIL / CHAT     │
  │   (Fixed)    │   (320px Panel)   │     (Flexible Main View)     │
  └──────────────┴───────────────────┴──────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────┐
  │                    FULLSCREEN FOCUS MODE                         │
  ├─────────────────────────────────────────────────────────────────┤
  │   SIDEBAR    │          TICKET DETAIL / CHAT (100% width)       │
  │   (Fixed)    │          Ticket list hidden via toggle button     │
  └──────────────┴──────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────┐
  │                        MOBILE VIEW (<768px)                     │
  ├─────────────────────────────────────────────────────────────────┤
  │ [☰] Header with Mobile Drawer Menu                              │
  ├─────────────────────────────────────────────────────────────────┤
  │ State 1: Shows Ticket List (Full Width)                         │
  │ State 2: When Ticket Tapped -> Displays Chat View + [← Back]    │
  └─────────────────────────────────────────────────────────────────┘
```

- **Sliding Navigation Drawer**: On mobile devices, clicking the hamburger icon `[☰]` slides out the navigation drawer with a frosted backdrop.
- **Single-Pane Chat View**: On mobile, selecting a ticket seamlessly switches from the list view to the dedicated ticket detail view, providing maximum screen space for reading and composing replies.
- **Fullscreen Focus Mode**: On desktop, agents can toggle fullscreen to hide the ticket list and focus entirely on the current conversation.

---

## 🛠️ Complete Technology Stack

### 🎨 Frontend Ecosystem

- **Framework**: [React 19](https://react.dev/) — Declarative UI library for high-speed component rendering.
- **Build Tool**: [Vite 6](https://vitejs.dev/) — Next-generation frontend tooling providing instant HMR (Hot Module Replacement).
- **Styling**: Vanilla CSS + [Tailwind CSS v4](https://tailwindcss.com/) — Clean design system with HSL colors, glassmorphism, dark mode, and custom shimmer animations.
- **Icons**: [Lucide React](https://lucide.dev/) — Crisp, modern vector icon set.
- **State & Routing**: Component-level state with URL parameter syncing and responsive mobile view state.

### ⚙️ Backend Ecosystem

- **Runtime**: [Node.js](https://nodejs.org/) (v20+ LTS) — High-throughput event-driven JavaScript engine.
- **Server Framework**: [Express.js](https://expressjs.com/) — Lightweight API routing with modular controllers.
- **Type Safety**: [TypeScript](https://www.typescriptlang.org/) — End-to-end type safety across shared payload schemas.
- **Authentication**: HTTP-Only Cookie Sessions with `bcryptjs` password hashing and role-based authorization middleware.
- **Validation**: [Zod](https://zod.dev/) — Strict runtime schema validation for incoming API payloads.

### 🗄️ Database & Storage

- **Database**: [PostgreSQL](https://www.postgresql.org/) — Enterprise-grade relational database hosted on Railway.
- **ORM**: [Prisma](https://www.prisma.io/) — Type-safe database client and automated migration tool.
- **Indexes**: Optimized indexes on `customerId`, `agentId`, `status`, `priority`, `category`, `ticketId`, `authorId`, and `notificationEmail` for sub-millisecond query performance.

### 🧠 Intelligence & NLP Engine

- **LLM Provider**: OpenAI-compatible Groq API running `llama-3.3-70b-versatile` for ticket analysis, categorization, summarization, and auto-reply generation.
- **NLP Validation**: [vader-sentiment](https://www.npmjs.com/package/vader-sentiment) — Local VADER (Valence Aware Dictionary and sEntiment Reasoner) for sentence-level sentiment validation with zero API cost.
- **Priority Scoring**: Custom multi-factor scoring engine combining sentiment + keywords + customer tier + category risk + thread escalation trends.
- **Email Delivery**: [Resend API](https://resend.com/) for transactional outbound emails and inbound webhook events.

---

## ⚙️ Software Development Lifecycle (SDLC) & Pipeline

```
┌────────────────┐    ┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  1. Local Dev  │ ──>│ 2. Automated    │ ──>│ 3. CI Pipeline   │ ──>│ 4. Production   │
│  Vite + Express│    │ Vitest + E2E    │    │ GitHub Actions   │    │ Vercel + Railway│
└────────────────┘    └─────────────────┘    └──────────────────┘    └─────────────────┘
```

### 1. Code Quality & Formatting

- **ESLint**: Strict TypeScript linting rules ensuring code quality and hook safety.
- **Prettier**: Automated code formatting across all workspace packages (`apps/web` and `apps/api`).

### 2. Testing Strategy

- **Unit & Integration Tests**: Run with **Vitest** — 44 tests across 8 test files covering auth guards, ticket APIs, email webhooks, VADER sentiment analysis, and priority scoring engine.
- **Browser E2E Tests**: Powered by **Playwright**, testing full end-to-end customer sign-up, ticket submission, agent resolution, and admin management.

### Test Files

| File | Tests | Coverage |
|------|-------|----------|
| `auth.test.ts` | 8 | Signup, login, logout, role guards, inactive users |
| `tickets.test.ts` | 8 | CRUD, assignment, workflow, filters, AI enrichment, polish |
| `email.test.ts` | 5 | Inbound webhooks, reply threading, Resend/Sender formats |
| `adminUsers.test.ts` | 6 | User listing, search, update, deactivation |
| `dashboard.test.ts` | 3 | Auth guards, metrics, analytics |
| `sentimentScoring.test.ts` | 4 | Priority scoring factors and edge cases |
| `vaderSentiment.test.ts` | 9 | Sentence-level analysis, ALL CAPS, negation, LLM/VADER reconciliation |
| `app.test.ts` | 1 | Server health check |

---

## 🚀 Quick Start Guide for Developers

### Prerequisites

- Node.js v20+
- PostgreSQL instance (local or remote)

### Installation Steps

1. **Clone Repository & Install Dependencies**:

   ```bash
   git clone https://github.com/yasuo72/Smart_Ticketing.git
   cd Smart_Ticketing
   npm install
   ```

2. **Configure Environment Variables**:
   Create `apps/api/.env`:

   ```env
   DATABASE_URL="Your Pg sql String"
   PORT=4000
   SESSION_SECRET="your-super-secret-random-key"
   WEB_ORIGIN="http://localhost:5173"
   AI_PROVIDER="groq"
   GROQ_API_KEY="your-groq-key"
   RESEND_API_KEY="your-resend-key"
   RESEND_FROM_EMAIL="support@yourdomain.com"
   ```

3. **Database Migration & Seeding**:

   ```bash
   npx prisma migrate dev --schema=apps/api/prisma/schema.prisma
   npm run db:seed --workspace apps/api
   ```

4. **Start Local Development Servers**:

   ```bash
   # Terminal 1: Start API server (http://localhost:4000)
   npm run dev:api

   # Terminal 2: Start Web server (http://localhost:5173)
   npm run dev:web
   ```

5. **Run Test Suites**:
   ```bash
   # Run Vitest unit & integration tests (44 tests)
   npm run test

   # Run Playwright E2E tests
   npm run test:e2e
   ```

---

## 🔒 Security & Best Practices

- 🔑 **Password Hashing**: Passwords stored using `bcryptjs` with salt rounds.
- 🍪 **Session Security**: HTTP-only cookies prevent XSS token theft.
- 🛡️ **Role Authorization**: Middleware verifies `CUSTOMER`, `AGENT`, and `ADMIN` scopes on every API route.
- 🧼 **Input Sanitization**: Payload validation using `Zod` blocks malicious data structures before hitting DB transactions.
- 📝 **Audit Trail**: Every ticket state change is logged with actor, action, and timestamp.

---

## 📄 License

Distributed under the MIT License. Built with ❤️ for seamless customer support operations.
:- Rohit Singh (Yasuo72)
