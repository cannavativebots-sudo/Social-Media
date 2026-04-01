# ---- Build stage ----
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY shared/package.json          ./shared/
COPY bots/package.json            ./bots/
COPY apps/api/package.json        ./apps/api/
COPY apps/dashboard/package.json  ./apps/dashboard/

RUN npm ci

COPY shared/          ./shared/
COPY apps/dashboard/  ./apps/dashboard/

RUN npm run build -w shared \
 && npm run build -w apps/dashboard


# ---- Production stage ----
FROM node:22-alpine AS production

WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY shared/package.json          ./shared/
COPY bots/package.json            ./bots/
COPY apps/api/package.json        ./apps/api/
COPY apps/dashboard/package.json  ./apps/dashboard/

RUN npm ci --omit=dev

COPY --from=builder /app/shared/dist               ./shared/dist
COPY --from=builder /app/apps/dashboard/.next      ./apps/dashboard/.next
COPY --from=builder /app/apps/dashboard/public     ./apps/dashboard/public 2>/dev/null || true

ENV NODE_ENV=production

EXPOSE 3000

USER node
CMD ["npm", "run", "start", "--workspace", "apps/dashboard"]
