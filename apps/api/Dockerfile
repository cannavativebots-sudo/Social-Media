# ---- Build stage ----
FROM node:22-alpine AS builder

WORKDIR /app

# Copy workspace manifests first for layer caching
COPY package.json package-lock.json tsconfig.base.json ./
COPY shared/package.json          ./shared/
COPY bots/package.json            ./bots/
COPY apps/api/package.json        ./apps/api/
# dashboard manifest is needed so npm ci doesn't complain about missing workspace
COPY apps/dashboard/package.json  ./apps/dashboard/

RUN npm ci

# Copy source
COPY shared/     ./shared/
COPY bots/       ./bots/
COPY apps/api/   ./apps/api/

# Build (shared → bots → api)
RUN npm run build -w shared \
 && echo "=== shared/dist ===" && ls shared/dist/ \
 && npm run build -w bots \
 && npm run build -w apps/api

# Copy SQL files into dist so migrate.js can find them at runtime
RUN cp -r apps/api/src/db/migrations apps/api/dist/db/migrations \
 && cp -r apps/api/src/db/seeds      apps/api/dist/db/seeds


# ---- Production stage ----
FROM node:22-alpine AS production

WORKDIR /app

# Re-install production deps only
COPY package.json package-lock.json tsconfig.base.json ./
COPY shared/package.json          ./shared/
COPY bots/package.json            ./bots/
COPY apps/api/package.json        ./apps/api/
COPY apps/dashboard/package.json  ./apps/dashboard/

RUN npm ci --omit=dev

# Copy built artifacts
COPY --from=builder /app/shared/dist        ./shared/dist
COPY --from=builder /app/bots/dist          ./bots/dist
COPY --from=builder /app/apps/api/dist      ./apps/api/dist

COPY apps/api/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3001

USER node
ENTRYPOINT ["/entrypoint.sh"]
