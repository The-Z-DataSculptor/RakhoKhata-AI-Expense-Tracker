# Backend/Dockerfile

# ==========================================================================
# === SECTION 1: BUILD STAGE ===
# ==========================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install OpenSSL required by Prisma CLI engine on Alpine
RUN apk add --no-cache openssl

# Copy dependency manifests first
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
COPY prisma.config.ts ./
COPY tsconfig.json ./

ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Clean install all dependencies
RUN npm ci --no-audit --no-fund

# Copy source code
COPY . .

# Wipe local Windows build artifacts
RUN rm -rf dist prisma/generated

# Generate Prisma Client & Compile TypeScript via esbuild
RUN npm run build

# ==========================================================================
# === SECTION 2: RUNTIME STAGE ===
# ==========================================================================
FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl

COPY package.json package-lock.json* ./
COPY prisma ./prisma/

ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

# Install production dependencies
RUN npm ci --omit=dev --no-audit --no-fund
RUN npx prisma generate

# Copy compiled dist files
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=development
ENV PORT=5000

EXPOSE 5000

CMD ["node", "dist/index.js"]