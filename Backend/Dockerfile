FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma engine compatibility
RUN apk add --no-cache openssl

# Copy dependency manifests and Prisma schema
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Restrict Node heap memory & skip audit calls to prevent memory spikes
ENV NODE_OPTIONS="--max-old-space-size=1024"
RUN npm ci --no-audit --no-fund

# Copy source code
COPY . .

# Generate Prisma Client (This generates it directly into node_modules)
RUN npx prisma generate

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["npm", "start"]