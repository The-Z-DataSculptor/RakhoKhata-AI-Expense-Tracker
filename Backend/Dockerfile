FROM node:20-alpine
WORKDIR /app

# Copy dependency manifests and Prisma schema first for layer caching
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install dependencies and generate Prisma Client
RUN npm ci
RUN npx prisma generate

# Copy the rest of the backend source code
COPY . .

EXPOSE 5000

# Apply database migrations on startup, then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]