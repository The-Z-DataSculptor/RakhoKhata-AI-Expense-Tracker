<img width="1541" height="892" alt="RakhoKhata Hero" src="https://github.com/user-attachments/assets/62b2289f-04ac-4ab4-bdf2-74d9aa9f574e" />

# 🚀 RakhoKhata — Intelligent Personal Finance & AI Analytics Suite

> A modern full-stack, dockerized financial tracking engine featuring multi-currency accounting, an encrypted PIN-protected investment vault, automated statement imports, background bill reminders, and an AI financial companion powered by Google Gemini.

---

## 💡 About The Project

Managing personal finances shouldn't feel like wrestling with complex spreadsheets. **RakhoKhata** turns raw transaction data into clear, actionable financial intelligence.

Whether tracking daily expenses across multiple currencies, importing bank statements, scheduling bill reminders, securing long-term investments behind a PIN-encrypted vault, or asking an AI assistant for a candid spending review, RakhoKhata simplifies money management into an intuitive, real-time dashboard.

Engineered as a decoupled full-stack architecture, RakhoKhata utilizes **Next.js 16** for server-rendered performance, **Express 5** for low-latency API processing, **Prisma 7** with **Neon Cloud PostgreSQL** for storage, and **Docker Compose** for single-command orchestration.

---

## 🌟 Key Features

### 🤖 AI Financial Companion & Leak Detector

- **Native Google Gemini SDK (`@google/genai`)**: Integrated via a secure, authenticated server gateway.
- **Spending Audits & Leak Warnings**: Analyzes workspace transaction history to highlight recurring impulse purchases and unused subscriptions.
- **Customizable AI Personas**: Get financial advice styled as an encouraging coach, strict auditor, or minimalist planner.

### 🔐 PIN-Protected Investment Vault

- Dedicated secure vault to track stocks, crypto, commodities, and custom asset profiles.
- Protected by a secondary **PIN authentication engine** with automated email reset flows (`vaultAuthController.ts`).
- Real-time ROI calculations and chronological asset value history logs.

### 💱 Multi-Currency & Workspace Engine

- Full support for multi-currency transaction logging (**PKR, USD, EUR, GBP, INR**, and dynamic conversions).
- Real-time balance calculations with workspace-wide base currency toggling (`CurrencyContext`, `WorkspaceContext`).

### 📊 Interactive Dashboard & Analytics

- Visual cash flow trends, budget health donuts, and category breakdowns powered by **Recharts**.
- "Safe to Spend" gauge controls and customizable metric rows to monitor net burn rates.

### 🔔 Notification Engine & Background Cron Workers

- **Background Worker (`billReminderWorker.ts`)**: Automated background job execution via **Node-Cron** checking for due bills and debt deadlines.
- Transactional email dispatching integrated with **Resend**.

### 📑 Statement Import & Export Pipeline

- Automated statement parsing via **ExcelJS** and **PapaParse** for instant bulk transaction uploads.
- On-demand PDF report generation built with **PDFKit**.
- Image avatar and receipt upload processing via **Multer**.

### 🔒 Enterprise Security & Verification Highway

- **Dual Authentication**: Hybrid PASETO (`paseto-ts`) and JWT security model with HttpOnly cookie handling.
- **Verification Highway**: Integrated email verification, password reset tokens, and rate-limited endpoints (`express-rate-limit`, `helmet`).

---

## 🛠️ Architecture & Tech Stack

```mermaid
graph TD
    A[📱 Next.js 16 Standalone UI<br/>React 19 • TypeScript • CSS Modules] -->|HTTP / REST API| B[⚙️ Express 5 Backend Core<br/>PASETO / JWT Auth • Zod • REST APIs]
    B -->|Prisma 7 ORM + PG Adapter| C[(🗄️ Neon Cloud Database<br/>PostgreSQL)]
    B -->|Secure Server Gateway| D[🤖 Google Gemini AI SDK<br/>@google/genai]
    B -->|Background Cron Job| E[⏰ Bill Reminder Worker<br/>Node-Cron]
    B -->|Email Highway| F[📧 Resend Email API]

    1. Frontend (expense-tracker)
Core Framework: Next.js 16 (v16.2.6), React 19 (v19.2.4), TypeScript 5

Form & Validation: React Hook Form (v7.76.1), Zod (v4.4.3), @hookform/resolvers

Data Visualization: Recharts (v3.8.1)

UI & Icons: CSS Modules, React Icons (v5.7.0), Sonner Toasts (v2.0.7)

Parsing & Cookies: PapaParse (v5.5.4), XLSX (v0.18.5), js-cookie (v3.0.8)

2. Backend (backend)
Runtime & Framework: Node.js, Express 5 (v5.2.1), tsx runner, TypeScript 5

Database & ORM: PostgreSQL (pg v8.22.0), Prisma ORM (v7.8.0) with @prisma/adapter-pg

AI Engine: Google GenAI SDK (@google/genai v2.12.0)

Security & Auth: PASETO (paseto-ts), JWT (jsonwebtoken), Bcrypt (v6.0.0), Helmet (v8.3.0), Express Rate Limit (v8.5.2)

Document Processing: ExcelJS (v4.4.0), PDFKit (v0.19.1), Multer (v2.2.0)

Workers & Email: Node-Cron (v4.6.0), Resend (v6.17.2)

Expense-Tracker/
├── docker-compose.yml
├── Backend/
│   ├── Dockerfile
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── prisma.config.ts
│   │   └── migrations/           # 11 Production Migrations
│   ├── public/uploads/avatars/   # Static avatar uploads
│   └── src/
│       ├── controllers/          # AI, Auth, Budget, Category, Export, Vault, etc.
│       ├── middleware/           # Auth & Rate Limiting
│       ├── routes/               # Modular REST endpoints
│       ├── services/             # Email & Notification Engines
│       └── workers/              # Bill Reminder Background Cron
└── Frontend/
    ├── Dockerfile
    ├── next.config.ts
    └── src/
        ├── app/                  # Next.js App Router (Auth, Dashboard, Marketing)
        ├── components/           # Modular UI components by domain
        ├── context/              # Workspace & Currency State
        └── utils/                # Environment-aware API Fetcher (api.ts)

🚀 Quick Start (Docker Deployment)
Launch the entire stack with a single command using Docker Compose.

Prerequisites
Docker Desktop installed and running.

Git installed.

Step 1: Clone the Repository

git clone [https://github.com/The-Z-DataSculptor/Expense-Tracker.git](https://github.com/The-Z-DataSculptor/Expense-Tracker.git)
cd Expense-Tracker

Step 2: Configure Environment Variables
Create a .env file in the Backend directory based on required keys:

cp Backend/.env.example Backend/.env

Step 3: Launch Containers
Spin up both the frontend and backend services in detached mode:

docker compose up -d --build

Step 4: Synchronize Database Schema
Push the Prisma schema to your Neon PostgreSQL instance directly from the backend container:

docker compose exec backend npx prisma db push

🌐 Application Endpoints
Once the containers start up successfully:

Frontend Dashboard: Access at http://localhost:3000

Backend API Engine: Health check available at http://localhost:5000/api/health

⚙️ Environment Configuration Guide
Your Backend/.env file should contain the following variables:

# Server Runtime
PORT=5000
NODE_ENV=production
CORS_ORIGIN=http://localhost:3000

# Database Connection (Neon Cloud PostgreSQL)
DATABASE_URL="postgresql://username:password@ep-sample-region.aws.neon.tech/neondb?sslmode=require"

# Authentication Secrets
JWT_SECRET="your_jwt_secret_key_here"
PASETO_SECRET_KEY="your_secure_paseto_secret_key_here"

# AI Integration
GEMINI_API_KEY="your_google_gemini_api_key_here"

# Transactional Email Alerts
RESEND_API_KEY="your_resend_api_key_here"

# Background Job Control
RUN_BACKGROUND_WORKERS=true

🛡️ Key Engineering Highlights
Environment-Aware API Layer: The frontend utilizes a dynamic base URL resolver (getApiBaseUrl) that switches seamlessly between Docker internal container DNS (http://backend:5000/api) during Next.js SSR and local browser access (http://localhost:5000/api).

Multi-Stage Docker Builds: Optimized node images reduce production container footprints while leveraging cached layer builds for lightning-fast deployments.

Isolated Server Gateway: The Google Gemini API key is completely isolated on the server; client applications communicate strictly via authenticated API proxies protected by rate limiters.

👤 Author & Maintainer
Syed Zain Hassan

Full-Stack Software Engineer & Systems Developer

📧 Email: ZainHassan@protonmail.com

💼 LinkedIn: syed-zain-hassan

💻 GitHub Profile: @The-Z-DataSculptor
```
