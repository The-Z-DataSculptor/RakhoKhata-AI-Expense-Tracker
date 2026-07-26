# Backend/Dockerfile

# ==========================================================================
# === SECTION 1: BASE IMAGE & DEPENDENCIES ===
# ==========================================================================
FROM node:20-alpine

WORKDIR /app

# Install OpenSSL required for Prisma binary engine on Alpine Linux
RUN apk add --no-cache openssl

# Copy dependency manifests, schema, and config
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Provide build-time environment variable for Prisma validation
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV NODE_OPTIONS="--max-old-space-size=1024"

# Install dependencies
RUN npm ci --no-audit --no-fund

# Copy application source code
COPY . .

# Generate Prisma Client & compile TypeScript to dist/
RUN npx prisma generate
RUN npm run build
# === SECTION 1 END ===

# ==========================================================================
# === SECTION 2: RUNTIME EXECUTION ===
# ==========================================================================
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["npm", "start"]
# === SECTION 2 END ===