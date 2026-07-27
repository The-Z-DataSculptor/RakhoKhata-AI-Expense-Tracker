# Frontend/Dockerfile

# ==========================================================================
# === SECTION 1: BUILD STAGE ===
# ==========================================================================
FROM node:20-slim AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json* ./

# Install all dependencies
RUN npm ci --no-audit --no-fund

# Copy source code
COPY . .

# Bake API URL into client bundle at build time
ARG NEXT_PUBLIC_API_URL=http://localhost:5000
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build Next.js application
RUN npm run build

# ==========================================================================
# === SECTION 2: RUNTIME STAGE ===
# ==========================================================================
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json* ./

# Install production dependencies only
RUN npm ci --omit=dev --no-audit --no-fund

# Copy built Next.js artifacts
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next

EXPOSE 3000

CMD ["npm", "start"]