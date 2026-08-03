# 🚀 Sahayak AI — Next-Gen AI Support Ecosystem

<div align="center">

  <img src="docs/images/hero-banner.jpg" alt="Smart Ticketing Hero Banner" width="100%" style="border-radius: 16px; margin-bottom: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);" />

  <img src="https://img.shields.io/badge/Status-Production%20Ready-emerald?style=for-the-badge&logo=rocket" alt="Status" />
  <img src="https://img.shields.io/badge/Frontend-Vercel%20%7C%20React%2019%20%7C%20Vite-blue?style=for-the-badge&logo=vercel" alt="Frontend" />
  <img src="https://img.shields.io/badge/Backend-Railway%20%7C%20Node.js%20%7C%20Express-purple?style=for-the-badge&logo=railway" alt="Backend" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL%20%7C%20Prisma%20ORM-336791?style=for-the-badge&logo=postgresql" alt="Database" />
  <img src="https://img.shields.io/badge/AI%20Engine-LLM%20%7C%20Groq%20%7C%20Llama%203.3-orange?style=for-the-badge&logo=openai" alt="AI Engine" />
  <img src="https://img.shields.io/badge/Email-Resend%20API-black?style=for-the-badge&logo=resend" alt="Email" />

  <p align="center">
    <b>A high-performance, autonomous, AI-driven customer support and ticket management system.</b><br />
    Designed for lightning-fast resolution, real-time analytics, two-way email synchronization, and mobile-first responsiveness.
  </p>

</div>

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
2. 🤖 **Solves Common Issues Instantly**: If a user asks a routine question (like how to reset a password), the AI auto-resolves the ticket immediately with clear, friendly instructions.
3. 🪄 **Empowers Support Staff**: For complex issues requiring human agents, the AI generates instant summaries and even rewrites rough agent notes into polished, professional replies with 1 click.
4. 📬 **Seamless Email Sync**: Customers can reply to support emails directly from Gmail, Outlook, or Apple Mail, and their messages appear instantly inside the agent's web ticket chat.

---

## 🧠 AI Engine & Smart Auto-Pilot Workflow

<div align="center">
  <img src="docs/images/ai-workflow.jpg" alt="AI Smart Engine Workflow" width="100%" style="border-radius: 12px; margin-top: 10px; margin-bottom: 20px;" />
</div>

---

## 🌟 Highlights & Core Capabilities

| Feature                    | Technical Implementation                                                                                                            | Non-Tech Explanation                                                           |
| :------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------- |
| **🤖 AI Auto-Pilot**       | Analyzes sentiment, categorizes tickets, generates summaries, and auto-resolves simple support requests using Groq / Llama 3.3.     | Saves 80% of routine customer support time automatically.                      |
| **📧 Two-Way Email Sync**  | Webhook integration with Resend API for automatic inbound ticket creation and outbound email notifications.                         | Customers use email as usual; support staff use a unified web dashboard.       |
| **🪄 1-Click AI Polisher** | Converts informal agent notes or draft answers into empathetic, professionally worded customer responses via AI prompt engineering. | No typos or awkward phrasing—always crisp, professional support.               |
| **📱 Mobile-First UI**     | Custom responsive sliding drawers, mobile hamburger menus, and seamless single-pane detail views.                                   | Works flawlessly on iPhones, Android devices, tablets, and desktops.           |
| **⚡ Shimmer Skeletons**   | Smooth loading states with custom animated skeleton UI placeholders preventing layout shift.                                        | Zero layout shifts or blank screens while data is loading.                     |
| **🛡️ Role-Based Security** | Multi-tenant authorization (Customer, Agent, Admin) with audit logs and secure HTTP-only cookies.                                   | Ensures customers only see their own tickets while staff manage the workspace. |

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
    Agent([🧑‍💻 Support Agent / Admin])
    EmailOut[✉️ Resend Email Service]

    %% Flow
    User -->|Sends Email| EmailInput
    User -->|Creates Ticket on Website| WebInput

    EmailInput -->|POST /api/email/inbound| API
    WebInput -->|POST /api/tickets| API

    API -->|Save Ticket| Prisma
    API -->|Trigger Async AI Enrichment| AI

    AI -->|Categorize & Summarize| Prisma
    AI -->|Auto-Resolve Routine Issues| User

    API -->|Push to Workspace| Agent
    Agent -->|1-Click Polish Reply| AI
    Agent -->|Send Reply| API

    API -->|Update Ticket & Audit Log| Prisma
    API -->|Send Email Notification| EmailOut
    EmailOut -->|Delivers Email| User
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

---

## 🛠️ Complete Technology Stack

### 🎨 Frontend Ecosystem

- **Framework**: [React 19](https://react.dev/) — Declarative UI library for high-speed component rendering.
- **Build Tool**: [Vite 6](https://vitejs.dev/) — Next-generation frontend tooling providing instant HMR (Hot Module Replacement).
- **Styling**: Vanilla CSS + [Tailwind CSS v4](https://tailwindcss.com/) — Clean design system with HSL colors, glassmorphism, and custom shimmer animations.
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

### 🧠 Intelligence & Integration Engine

- **LLM Provider**: OpenAI-compatible Groq API running `llama-3.3-70b-versatile`.
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

- **Unit & Integration Tests**: Run with **Vitest** testing database isolation, auth guards, ticket APIs, and email webhooks (31/31 tests passing).
- **Browser E2E Tests**: Powered by **Playwright**, testing full end-to-end customer sign-up, ticket submission, agent resolution, and admin management.

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
   RESEND_FROM_EMAIL="support@rohitis.online"
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
   # Run Vitest unit & integration tests
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

---

## 📄 License

Distributed under the MIT License. Built with ❤️ for seamless customer support operations.
:- Rohit Singh (Yasuo72)
