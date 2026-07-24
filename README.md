Markdown
<img width="1541" height="892" alt="RakhoKhata Hero Header" src="https://github.com/user-attachments/assets/62b2289f-04ac-4ab4-bdf2-74d9aa9f574e" />

# 🚀 RakhoKhata — Intelligent Personal Finance & AI Analytics

> A full-stack, containerized financial workspace featuring multi-currency accounting, a PIN-protected investment vault, automated statement parsing, background bill reminders, and AI-driven spending insights powered by Google Gemini.

---

## 💡 Overview

Managing personal finances shouldn't require wrestling with messy spreadsheets or juggling detached banking apps. **RakhoKhata** turns raw transaction data into clear, actionable financial intelligence.

Whether you need to track multi-currency expenses, import bank statements in bulk, set automated bill reminders, store long-term assets inside a PIN-encrypted vault, or get candid spending advice from an AI assistant, RakhoKhata gives you total visibility over your financial health in one real-time dashboard.

Engineered as a decoupled full-stack application, RakhoKhata uses **Next.js 16** for server-rendered speed, **Express 5** for backend processing, **Prisma 7** with **Neon Cloud PostgreSQL** for storage, and **Docker Compose** for single-command setup.

---

## 🌟 Key Features

### 🤖 AI Financial Companion & Spending Audits

- **Google Gemini Integration**: Uses `@google/genai` through an isolated, rate-limited server gateway.
- **Leak Detection**: Scans workspace history to catch unused subscriptions, impulse buys, and recurring budget drains.
- **Flexible Personas**: Choose how your AI coach speaks to you — from an encouraging advisor to a direct, strict financial auditor.

### 🔐 Encrypted Investment Vault

- **Private Asset Tracking**: Keep stocks, crypto, precious metals, and custom assets behind a secure secondary PIN layer.
- **Real-time Metrics**: Live ROI tracking, total portfolio value, and historical performance logs.
- **PIN Reset Flow**: Automated tokenized email reset system (`vaultAuthController.ts`).

### 💱 Multi-Currency & Workspace Engine

- **Global Currency Support**: Native support for PKR, USD, EUR, GBP, INR, and automated base conversions.
- **Dynamic Workspace Toggling**: Instantly view net worth and cash flow in any preferred base currency.

### 📊 Interactive Visual Analytics

- **Recharts Dashboard**: Dynamic cash flow trends, monthly budget health donuts, and category burn rates.
- **"Safe to Spend" Indicator**: Keeps your daily discretionary spending aligned with monthly targets.

### 🔔 Automated Background Tasks

- **Cron Workers (`billReminderWorker.ts`)**: Background job checking for upcoming bill deadlines and debt reminders.
- **Transactional Emails**: Automated email alerts powered by **Resend**.

### 📑 Document Imports & Report Exports

- **Bulk Statement Imports**: Upload spreadsheets and bank exports using **ExcelJS** and **PapaParse**.
- **PDF Report Generator**: Create clean, downloadable financial statements with **PDFKit**.
- **Receipt & Avatar Uploads**: Handled cleanly via **Multer** storage middleware.

### 🔒 Enterprise Security

- **Hybrid Authentication**: Dual-token architecture using **PASETO** (`paseto-ts`) and **JWT** with HttpOnly cookies.
- **API Protection**: Tight endpoint protection using **Helmet**, rate limiters, CORS isolation, and **Zod** schema validation.

---

## 🛠️ Architecture & Tech Stack

```mermaid
graph TD
    A[📱 Next.js 16 Standalone UI<br/>React 19 • TypeScript • CSS Modules] -->|HTTP / REST API| B[⚙️ Express 5 Backend Core<br/>PASETO / JWT Auth • Zod • REST APIs]
    B -->|Prisma 7 ORM + PG Adapter| C[(🗄️ Neon Cloud Database<br/>PostgreSQL)]
    B -->|Secure Server Gateway| D[🤖 Google Gemini AI SDK<br/>@google/genai]
    B -->|Background Cron Job| E[⏰ Bill Reminder Worker<br/>Node-Cron]
    B -->|Email Service| F[📧 Resend Email API]
1. Frontend (Frontend/)
Core Framework: Next.js 16 (v16.2.6), React 19 (v19.2.4), TypeScript 5

State & Forms: React Hook Form (v7.76.1), Zod (v4.4.3), @hookform/resolvers

Charts & Styling: Recharts (v3.8.1), CSS Modules, React Icons (v5.7.0), Sonner (v2.0.7)

Utilities: PapaParse (v5.5.4), XLSX (v0.18.5), js-cookie (v3.0.8)

2. Backend (Backend/)
Runtime & API: Node.js, Express 5 (v5.2.1), tsx runner, TypeScript 5

Database & ORM: PostgreSQL (pg v8.22.0), Prisma ORM (v7.8.0) with @prisma/adapter-pg

AI Engine: @google/genai (v2.12.0)

Auth & Security: PASETO (paseto-ts), JWT (jsonwebtoken), Bcrypt (v6.0.0), Helmet (v8.3.0), Express Rate Limit (v8.5.2)

Files & Reports: ExcelJS (v4.4.0), PDFKit (v0.19.1), Multer (v2.2.0)

Scheduling & Mail: Node-Cron (v4.6.0), Resend (v6.17.2)

📂 Project Structure
Plaintext
Expense-Tracker/
├── docker-compose.yml
├── Backend/
│   ├── Dockerfile
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── prisma.config.ts
│   │   └── migrations/           # Database schema migrations
│   ├── public/uploads/avatars/   # Static user uploads
│   └── src/
│       ├── controllers/          # AI, Auth, Budget, Category, Vault, etc.
│       ├── middleware/           # Auth validation & rate limiting
│       ├── routes/               # Modular Express API endpoints
│       ├── services/             # Email & notification dispatchers
│       └── workers/              # Background bill reminder cron jobs
└── Frontend/
    ├── Dockerfile
    ├── next.config.ts
    └── src/
        ├── app/                  # Next.js App Router (Auth, Dashboard, Marketing)
        ├── components/           # Domain-driven React components
        ├── context/              # Currency & Workspace state providers
        └── utils/                # Environment-aware API fetcher (api.ts)
🚀 Quick Start (Docker Setup)
Launch the entire stack with a single command using Docker Compose.

Prerequisites
Docker Desktop installed and running.

Git installed.

Step 1: Clone the Repository
Bash
git clone [https://github.com/The-Z-DataSculptor/Expense-Tracker.git](https://github.com/The-Z-DataSculptor/Expense-Tracker.git)
cd Expense-Tracker
Step 2: Configure Environment Variables
Create a .env file in the Backend directory based on the configuration guide below:

Bash
cp Backend/.env.example Backend/.env
Step 3: Launch Services
Spin up both the frontend and backend services in detached mode:

Bash
docker compose up -d --build
Step 4: Sync the Database Schema
Push the Prisma schema to your Neon PostgreSQL instance directly from the container:

Bash
docker compose exec backend npx prisma db push
🌐 Application Endpoints
Once the containers start up successfully:

Frontend Dashboard: Access at http://localhost:3000

Backend API Engine: Health check available at http://localhost:5000/api/health

⚙️ Environment Variables (Backend/.env)
Configure your environment keys inside Backend/.env:

Code snippet
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

# Email Delivery & Background Workers
RESEND_API_KEY="your_resend_api_key_here"
RUN_BACKGROUND_WORKERS=true
🛡️ Key Engineering Details
Environment-Aware API Routing: The frontend uses a dynamic base URL resolver (getApiBaseUrl) that routes server-side requests through Docker's internal container DNS (http://backend:5000/api) during Next.js SSR, and client-side requests through host-mapped ports (http://localhost:5000/api).

Multi-Stage Docker Builds: Optimized Alpine Linux containers separate build-time dependencies from runtime assets, drastically reducing image sizes.

Secure API Gateway: The Google Gemini API key remains strictly server-side; client applications communicate through authenticated, rate-limited backend endpoints.

👤 Author & Maintainer
Syed Zain Hassan

Full-Stack Software Engineer & Systems Developer

📧 Email: ZainHassan@protonmail.com

💼 LinkedIn: syed-zain-hassan

💻 GitHub: @The-Z-DataSculptor
```
