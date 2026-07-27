# Frontend/Dockerfile

# ==========================================================================
# === SECTION 1: BUILD STAGE ===
# ==========================================================================
FROM node:20-slim AS builder

WORKDIR /app

COPY package.json package-lock.json* ./

# Install all dependencies sequentially
RUN npm ci --no-audit --no-fund

COPY . .

# Build argument passed from docker-compose.yml
ARG INTERNAL_API_URL=http://expense-backend-app:5000
ENV INTERNAL_API_URL=$INTERNAL_API_URL
ENV NEXT_TELEMETRY_DISABLED=1

# Compile Next.js production build with rewrites mapped to Docker backend URL
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

# Install ONLY production dependencies sequentially
RUN npm ci --omit=dev --no-audit --no-fund

# Copy standalone build artifacts from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next

EXPOSE 3000

CMD ["npm", "start"]