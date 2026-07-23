# Dockerfile

# ==========================================================================
# === SECTION 1: DEPENDENCY INSTALLATION STAGE ===
# ==========================================================================
# WHY THIS FIX WAS MADE: Uses a pinned Node.js 20 Alpine image with libc6-compat 
# to support native C++ binary dependencies (e.g. sharp, bcrypt, or canvas).
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# WHY THIS FIX WAS MADE: Copies manifest files separately to take advantage of 
# Docker layer caching when dependencies have not changed.
COPY package.json package-lock.json* ./

# WHY THIS FIX WAS MADE: Uses Docker BuildKit cache mounts to persist the npm package cache, 
# drastically speeding up multi-stage container builds.
RUN --mount=type=cache,target=/root/.npm \
    npm ci
# === SECTION 1 END ===

# ==========================================================================
# === SECTION 2: APPLICATION BUILD STAGE ===
# ==========================================================================
FROM node:20-alpine AS builder
WORKDIR /app

# WHY THIS FIX WAS MADE: Disables telemetry reporting during build phase to prevent 
# unnecessary external network calls and improve compilation speed.
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# WHY THIS FIX WAS MADE: Provides a safe fallback default for NEXT_PUBLIC_API_URL 
# to prevent baking 'undefined' string variables into client-side JavaScript bundles.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:5000}

# WHY THIS FIX WAS MADE: Compiles the Next.js application into a standalone bundle.
RUN npm run build
# === SECTION 2 END ===

# ==========================================================================
# === SECTION 3: PRODUCTION RUNNER STAGE ===
# ==========================================================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# WHY THIS FIX WAS MADE: Creates system group and user in a single RUN step 
# with explicit numeric IDs for consistent security auditing.
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# WHY THIS FIX WAS MADE: Explicitly assigns ownership (--chown=nextjs:nodejs) 
# to all copied assets to prevent permission denied errors under non-root execution.
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# WHY THIS FIX WAS MADE: Adds a native Node.js HTTP healthcheck script so orchestrators 
# (Kubernetes, AWS ECS) can monitor container health without requiring external tools like curl.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
# === SECTION 3 END ===