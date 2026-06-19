# ─────────────────────────────────────────
# STAGE: deps (solo package.json → npm ci)
# ─────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ─────────────────────────────────────────
# STAGE: builder (compilación)
# ─────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
ENV NODE_OPTIONS="--max-old-space-size=384"
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ─────────────────────────────────────────
# STAGE: runner (solo runtime)
# ─────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/next.config.ts ./
EXPOSE 3000
CMD ["npm", "run", "start"]
