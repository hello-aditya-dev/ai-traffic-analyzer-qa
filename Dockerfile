# AI Traffic Analyzer — production image
# Multi-stage build: install deps → build → runtime image.

# ---- Dependencies ----
FROM node:20-slim AS deps
WORKDIR /app
RUN npm install -g bun
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# ---- Builder ----
FROM node:20-slim AS builder
WORKDIR /app
RUN npm install -g bun
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma client + build
RUN bun run db:generate
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# ---- Runtime ----
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Persistent data volumes
RUN mkdir -p /app/db /app/storage/videos /app/storage/outputs
VOLUME ["/app/db", "/app/storage"]

EXPOSE 3000

# Run migrations + seed on first start, then start the server
CMD ["sh", "-c", "bunx prisma db push --accept-data-loss && node server.js"]
