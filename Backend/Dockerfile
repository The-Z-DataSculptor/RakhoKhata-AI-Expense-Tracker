# Backend/Dockerfile

# ==========================================================================
# === SECTION 1: BUILD STAGE ===
# ==========================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install OpenSSL required for Prisma binary engine on Alpine Linux
RUN apk add --no-cache openssl

# Copy dependency manifests and configuration
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
COPY prisma.config.ts ./
COPY tsconfig.json ./

# Dummy DATABASE_URL for Prisma build validation
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV NODE_OPTIONS="--max-old-space-size=1024"

# Clean install all dependencies (including devDependencies for build)
RUN npm ci --no-audit --no-fund

# Copy application source code
COPY . .

# Generate Prisma Client and compile TypeScript with skipLibCheck
RUN npx prisma generate
RUN npx tsc --skipLibCheck

# ==========================================================================
# === SECTION 2: RUNTIME STAGE ===
# ==========================================================================
FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl

COPY package.json package-lock.json* ./
COPY prisma ./prisma/

ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

# Install production dependencies only
RUN npm ci --omit=dev --no-audit --no-fund
RUN npx prisma generate

# Copy compiled JavaScript dist files from builder stage
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "dist/index.js"]