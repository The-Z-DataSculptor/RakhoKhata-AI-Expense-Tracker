# Backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma engine compatibility
RUN apk add --no-cache openssl

# Copy dependency manifests and Prisma schema for layer caching
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Restrict Node heap memory & skip audit calls to prevent WSL2 RAM spikes
ENV NODE_OPTIONS="--max-old-space-size=1024"
RUN npm ci --no-audit --no-fund

# Generate Prisma Client types
RUN npx prisma generate

# Copy source code
COPY . .

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["npm", "start"]