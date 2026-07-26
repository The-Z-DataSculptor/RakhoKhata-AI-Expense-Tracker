# Frontend/Dockerfile

# ==========================================================================
# === SECTION 1: BASE IMAGE & DEPENDENCIES ===
# ==========================================================================
FROM node:20-alpine

WORKDIR /app

# Install compatibility libraries required for Next.js SWC compiler on Alpine Linux
RUN apk add --no-cache libc6-compat

# Copy dependency manifests for layer caching
COPY package.json package-lock.json* ./

# Clean dependency installation
RUN npm ci

# Copy application source code
COPY . .
# === SECTION 1 END ===

# ==========================================================================
# === SECTION 2: BUILD CONFIGURATION & ENVIRONMENT VARIABLES ===
# ==========================================================================
# Declare build argument with local development fallback so NEXT_PUBLIC_API_URL 
# is explicitly baked into the Next.js client bundle during build time.
ARG NEXT_PUBLIC_API_URL=http://localhost:5000
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Disable Next.js telemetry and configure production runtime
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV PORT=3000

# Build the Next.js production bundle
RUN npm run build
# === SECTION 2 END ===

# ==========================================================================
# === SECTION 3: RUNTIME EXECUTION ===
# ==========================================================================
EXPOSE 3000

CMD ["npm", "start"]
# === SECTION 3 END ===