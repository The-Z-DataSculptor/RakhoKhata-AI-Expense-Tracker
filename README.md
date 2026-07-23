# 🚀 RakhoKhata — Intelligent Personal Finance & AI Analytics Suite

> A full-stack, dockerized financial tracking engine featuring multi-currency accounting, automated statement imports, interactive analytics, and an AI financial companion powered by Google Gemini.

---

## 💡 About The Project

Managing personal finances shouldn't feel like navigating a complex spreadsheet. **RakhoKhata** was built to turn raw financial data into clear, actionable insights. Whether tracking daily expenses across multiple currencies, importing bank statements, or asking an AI assistant for a candid spending review, RakhoKhata simplifies money management into an intuitive, real-time dashboard.

The application is engineered as a modern decoupled full-stack architecture, utilizing Next.js for server-rendered performance on the frontend, Express 5 for low-latency backend processing, Neon Cloud PostgreSQL for storage, and Docker Compose for seamless containerized orchestration.

---

## 🌟 Key Features

### 🤖 AI Financial Companion
- Integrated with the native **Google Gemini SDK** (`@google/genai`) via a secure backend gateway.
- Generates plain-English financial breakdowns, spending audit reports, and tailored budgeting advice.
- Features customizable commentary personas ranging from encouraging financial coaching to direct, roast-style budget reviews.

### 💱 Multi-Currency & Workspace Engine
- Full support for multi-currency transaction logging (PKR, USD, EUR, GBP, INR, and dynamic base conversions).
- Real-time balance calculations with workspace-wide base currency toggles.

### 📊 Interactive Analytics & Dashboard
- Visual cash flow trends, budget health gauges, and category breakdowns powered by **Recharts**.
- "Safe to Spend" gauge controls to keep daily expenditure aligned with monthly targets.

### 📑 Document Parsing & Export Engine
- Automated statement parsing via **ExcelJS** and **PapaParse** for instant batch transaction uploads.
- Automated PDF report generation built with **PDFKit**.
- Image receipt upload pipeline powered by **Multer**.

### 🔒 Enterprise-Grade Security
- Modern **PASETO token-based authentication** (stateless and cryptographically secure).
- Strict endpoint rate-limiting, CORS origin isolation, and payload validation using **Zod**.
- Background cron scheduling via **Node-Cron** for automated notifications and email alerts via **Resend**.

### 🐳 100% Dockerized Deployment
- Optimized multi-stage Docker builds utilizing Next.js `standalone` mode to minimize container footprint.
- Single-command orchestration for frontend, backend, and database migrations via Docker Compose.

---

## 🛠️ Architecture & Tech Stack

## 🛠️ System Architecture

```mermaid
graph TD
    A[📱 Next.js 16 Standalone UI<br/>React 19 • TypeScript • CSS Modules] -->|HTTP / REST API| B[⚙️ Express 5 Backend Core<br/>PASETO Auth • Zod • REST APIs]
    B -->|Prisma ORM| C[(🗄️ Neon Cloud Database<br/>PostgreSQL)]
    B -->|Secure Server Gateway| D[🤖 Google Gemini AI SDK<br/>@google/genai]
```

| Layer | Technology Stack |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, CSS Modules, Tailwind CSS, shadcn/ui, Recharts, React Hook Form |
| **Backend** | Node.js, Express 5, PASETO Auth, Zod Validation, Node-Cron, Resend Email API |
| **Database & Tools** | PostgreSQL (Neon Cloud), Prisma ORM, ExcelJS, PapaParse, PDFKit, Multer |
| **AI Integration** | Google Gemini AI SDK (`@google/genai`) |
| **DevOps & Containers** | Docker, Docker Compose (Multi-stage Node/Alpine builds) |

---

## 🚀 Quick Start (Docker Deployment)

The entire system is configured to launch with a single command using Docker Compose.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
- [Git](https://git-scm.com/) installed.

### Step 1: Clone the Repository
```bash
Step 2: Configure Environment Variables
Create a .env file in the backend directory based on the example configuration:

Bash
cp Backend/.env.example Backend/.env
Step 3: Launch Containers
Spin up both the frontend and backend services in detached mode:

Bash
docker compose up -d --build
Step 4: Run Database Migrations
Synchronize your Neon PostgreSQL schema directly inside the backend container:

Bash
docker compose exec backend npx prisma migrate deploy
Once the containers start up:

Frontend Dashboard: Access at http://localhost:3000

Backend API Engine: Health check available at http://localhost:5000/api/health

⚙️ Environment Configuration Guide
Your Backend/.env file should follow this structure:
# Server Configuration
PORT=5000
NODE_ENV=production

# Database Connection (Neon PostgreSQL)
DATABASE_URL="postgresql://username:password@ep-sample-region.aws.neon.tech/neondb?sslmode=require"

# Authentication Secrets
PASETO_SECRET_KEY="your_secure_paseto_secret_key_here"

# AI Integration
GEMINI_API_KEY="your_google_gemini_api_key_here"

# Email Notifications (Optional)
RESEND_API_KEY="your_resend_api_key_here"

🛡️ Key Engineering Highlights
Multi-Stage Build Optimization: The Next.js frontend uses standalone output configuration inside Docker, reducing the production runtime container size significantly by stripping non-essential node modules.

Database Resilience: Prisma migrations run directly against Neon Cloud PostgreSQL, ensuring zero downtime and complete schema synchronization across deployments.

Secure API Isolation: The Gemini AI API key is never exposed to the client browser; all AI interactions route through an authenticated Express server gateway with rate-limiting protection.

👤 Author & Maintainer
Zain Hassan

Full-Stack Software Engineer & Systems Developer

📧 Email: ZainHassan@protonmail.com

💼 LinkedIn: syed-zain-hassan

💻 GitHub Profile: @The-Z-DataSculptor
