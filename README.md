<img width="1541" height="892" alt="RakhoKhata Hero Header" src="https://github.com/user-attachments/assets/62b2289f-04ac-4ab4-bdf2-74d9aa9f574e" />

# 🚀 RakhoKhata — Intelligent Personal Finance & AI Analytics

> A modern full-stack, containerized financial workspace featuring multi-currency accounting, a PIN-protected investment vault, automated statement parsing, background bill reminders, and AI-driven spending insights powered by Google Gemini.

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
```

### 💻 Frontend Stack (`Frontend/`)

| Category                | Technologies & Libraries                    | Version               |
| :---------------------- | :------------------------------------------ | :-------------------- |
| **Core Framework**      | Next.js 16, React 19, TypeScript 5          | `v16.2.6` / `v19.2.4` |
| **Forms & Validation**  | React Hook Form, Zod, `@hookform/resolvers` | `v7.76.1` / `v4.4.3`  |
| **Data Visualization**  | Recharts, CSS Modules                       | `v3.8.1`              |
| **UI & Feedback**       | React Icons, Sonner Toasts                  | `v5.7.0` / `v2.0.7`   |
| **Parsing & Utilities** | PapaParse, XLSX, `js-cookie`                | `v5.5.4` / `v0.18.5`  |

---

### ⚙️ Backend Stack (`Backend/`)

| Category                | Technologies & Libraries                              | Version              |
| :---------------------- | :---------------------------------------------------- | :------------------- |
| **Runtime & API**       | Node.js, Express 5, `tsx` runner, TypeScript 5        | `v5.2.1` / `v5.7.0`  |
| **Database & ORM**      | PostgreSQL (`pg`), Prisma ORM (`@prisma/adapter-pg`)  | `v8.22.0` / `v7.8.0` |
| **AI Intelligence**     | Google GenAI SDK (`@google/genai`)                    | `v2.12.0`            |
| **Security & Auth**     | PASETO (`paseto-ts`), JWT, Bcrypt, Helmet, Rate Limit | `v2.0.6` / `v8.3.0`  |
| **Document Processing** | ExcelJS, PDFKit, Multer                               | `v4.4.0` / `v0.19.1` |
| **Workers & Email**     | Node-Cron, Resend Email API                           | `v4.6.0` / `v6.17.2` |

---

## 📂 Project Structure

```text
RakhoKhata-AI-Expense-Tracker/
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
```

---

## 🚀 Quick Start (Docker Setup)

Get the full-stack app running locally in less than 2 minutes using **Docker Compose**.

### 📋 Prerequisites

Make sure you have these installed and running:

- **[Docker Desktop](https://www.docker.com/products/docker-desktop/)**
- **[Git](https://git-scm.com/)**

---

### ⚡ Setup Guide

#### Step 1: Clone the Repo

```bash
git clone [https://github.com/The-Z-DataSculptor/RakhoKhata-AI-Expense-Tracker.git](https://github.com/The-Z-DataSculptor/RakhoKhata-AI-Expense-Tracker.git)
cd RakhoKhata-AI-Expense-Tracker
```

#### Step 2: Configure Environment Keys

Create your backend environment configuration file:

```bash
cp Backend/.env.example Backend/.env
```

#### Step 3: Launch Services

Build and start both frontend and backend containers in the background:

```bash
docker compose up -d --build
```

#### Step 4: Sync Your Database

Push the Prisma schema to your PostgreSQL instance:

```bash
docker compose exec backend npx prisma db push
```

---

## 🌐 Live Application Endpoints

Once your containers are up, access the stack at:

| Service         | Address                            | Purpose                       |
| :-------------- | :--------------------------------- | :---------------------------- |
| **Frontend UI** | `http://localhost:3000`            | Next.js Interactive Dashboard |
| **Backend API** | `http://localhost:5000/api/health` | Express Engine Health Check   |

---

## ⚙️ Environment Configuration (`Backend/.env`)

Configure your keys in `Backend/.env`:

```env
# Server Setup
PORT=5000
NODE_ENV=production
CORS_ORIGIN=http://localhost:3000

# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:pass@ep-sample.aws.neon.tech/neondb?sslmode=require"

# Security & Auth
JWT_SECRET="your_jwt_secret_here"
PASETO_SECRET_KEY="your_paseto_secret_here"

# Services & AI
GEMINI_API_KEY="your_google_gemini_api_key"
RESEND_API_KEY="your_resend_api_key"
RUN_BACKGROUND_WORKERS=true
```

---

## 🛡️ Key Architecture Highlights

- **Smart Environment Aware Routing:** The API fetcher automatically routes server-side calls through internal Docker DNS (`http://backend:5000/api`) during Next.js SSR, while routing browser calls through `http://localhost:5000/api`.
- **Lightweight Docker Footprint:** Multi-stage Alpine Linux builds separate build tools from runtime assets to keep container sizes small.
- **Isolated AI Gateway:** Gemini API keys never reach the browser — all AI queries are handled by rate-limited backend proxies.

---

## 👤 Author & Maintainer

**Syed Zain Hassan**  
_Full-Stack Software Engineer & Systems Developer_

[![Email](https://img.shields.io/badge/Email-ZainHassan%40protonmail.com-blue?style=flat&logo=protonmail)](mailto:ZainHassan@protonmail.com)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-syed--zain--hassan-0A66C2?style=flat&logo=linkedin)](https://linkedin.com/in/syed-zain-hassan)
[![GitHub](https://img.shields.io/badge/GitHub-@The--Z--DataSculptor-181717?style=flat&logo=github)](https://github.com/The-Z-DataSculptor)
