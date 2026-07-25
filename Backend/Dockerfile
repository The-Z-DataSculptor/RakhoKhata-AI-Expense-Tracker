FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma engine compatibility
RUN apk add --no-cache openssl

# Copy dependency manifests, Prisma schema, AND Prisma config
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Restrict Node heap memory & skip audit calls to prevent memory spikes
ENV NODE_OPTIONS="--max-old-space-size=1024"
RUN npm ci --no-audit --no-fund

# Generate Prisma Client (now it can find prisma.config.ts)
RUN npx prisma generate

# Copy the rest of the application source code
COPY . .

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["npm", "start"]