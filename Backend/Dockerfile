# Backend/Dockerfile

# ==========================================================================
# === SECTION 1: BUILDER STAGE ===
# ==========================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL required by Prisma engine during binary compilation
RUN apk add --no-cache openssl

# Copy dependency manifests and Prisma schema for optimal layer caching
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies needed for TypeScript compilation)
RUN npm ci

# Generate Prisma Client types
RUN npx prisma generate

# Copy application source code and compile TypeScript to JavaScript
COPY . .
RUN npm run build
# === SECTION 1 END ===

# ==========================================================================
# === SECTION 2: PRODUCTION RUNNER STAGE ===
# ==========================================================================
FROM node:20-alpine AS runner

# WHY THIS FIX WAS MADE: Enforces production mode optimizations for Express and Prisma performance.
ENV NODE_ENV=production
ENV PORT=5000

WORKDIR /app

# Install OpenSSL runtime dependency for Prisma in Alpine
RUN apk add --no-cache openssl

# Copy manifests and Prisma schema
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# WHY THIS FIX WAS MADE: Installs ONLY production dependencies to minimize container image size and attack surface.
RUN npm ci --omit=dev && npm cache clean --force

# Re-generate production Prisma Client
RUN npx prisma generate

# WHY THIS FIX WAS MADE: Copies compiled JavaScript build output from the builder stage, keeping source files out of production.
COPY --from=builder /app/dist ./dist

# WHY THIS FIX WAS MADE: Assigns directory ownership to the unprivileged 'node' user and drops root privileges.
RUN chown -R node:node /app
USER node

EXPOSE 5000

# WHY THIS FIX WAS MADE: Direct execution of the Node binary allows PID 1 to receive SIGTERM/SIGINT signals,
# enabling graceful server shutdown and clean database connection draining.
CMD ["node", "dist/index.js"]
# === SECTION 2 END ===