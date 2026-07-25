FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma engine compatibility
RUN apk add --no-cache openssl

# Copy dependency manifests, schema, and config
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Provide a build-time placeholder so Prisma 7's env("DATABASE_URL") helper validates
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV NODE_OPTIONS="--max-old-space-size=1024"

# 1. Install dependencies
RUN npm ci --no-audit --no-fund

# 2. Copy ALL application source code FIRST
COPY . .

# 3. Generate Prisma Client AFTER copying code (so generated files are preserved)
RUN npx prisma generate

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["npm", "start"]