# ==================== Stage 1: Install ====================
FROM node:20-alpine AS install
WORKDIR /app

# Copy prisma schema alongside package files so npm ci can run postinstall
COPY prisma ./prisma
COPY package.json package-lock.json ./
RUN npm ci

# ==================== Stage 2: Build ====================
FROM node:20-alpine AS build
WORKDIR /app

ARG CACHE_BUST=0
COPY --from=install /app/node_modules ./node_modules
COPY . .

# Prisma generate + Next.js build
RUN npm run build

# ==================== Stage 3: Production ====================
FROM node:20-alpine AS production
WORKDIR /app

LABEL org.opencontainers.image.title="aidrama-studio" \
      org.opencontainers.image.description="AI-powered novel-to-video production platform" \
      org.opencontainers.image.vendor="EvoLinkAI" \
      org.opencontainers.image.source="https://github.com/EvoLinkAI/ai-short-drama" \
      org.opencontainers.image.licenses="MIT"

ENV NODE_ENV=production

# Install tini for proper signal handling
RUN apk add --no-cache tini

# Runtime dependencies — includes devDeps since npm run start requires concurrently + tsx
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules

# Next.js build output
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public

# Worker and watchdog source (tsx runs TypeScript directly)
COPY --from=build /app/src ./src
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/lib ./lib

# Prisma schema (required for db push on startup)
COPY --from=build /app/prisma ./prisma

# Pricing and capability standards
COPY --from=build /app/standards ./standards

# i18n messages and config files
COPY --from=build /app/messages ./messages
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY --from=build /app/next.config.ts ./next.config.ts
COPY --from=build /app/postcss.config.mjs ./postcss.config.mjs

# Runtime log directory + empty .env (tsx --env-file=.env requires the file to exist;
# actual env vars are injected by docker-compose at runtime)
RUN mkdir -p /app/logs && touch /app/.env

EXPOSE 3000 3010

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["npm", "run", "start"]
