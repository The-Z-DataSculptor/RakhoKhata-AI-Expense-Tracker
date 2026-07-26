# Backend/Dockerfile

# ==========================================================================
# === SECTION 1: BUILD STAGE ===
# ==========================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL required for Prisma binary engine on Alpine Linux
RUN apk add --no-cache openssl

# Copy package manifests and config files
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
COPY prisma.config.ts ./
COPY tsconfig.json ./

# Provide dummy DATABASE_URL for Prisma 7 build check
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV NODE_OPTIONS="--max-old-space-size=1024"

# Install ALL dependencies (including devDependencies for tsc and @types)
RUN npm ci --no-audit --no-fund

# Copy source files
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Compile TypeScript explicitly with skipLibCheck to ignore external type conflicts
RUN npx tsc --skipLibCheck

# ==========================================================================
# === SECTION 2: RUNTIME STAGE ===
# ==========================================================================
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl

COPY package.json package-lock.json* ./
COPY prisma ./prisma/

ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

# Install production dependencies only
RUN npm ci --omit=dev --no-audit --no-fund
RUN npx prisma generate

# Copy built dist files from builder
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "dist/index.js"]