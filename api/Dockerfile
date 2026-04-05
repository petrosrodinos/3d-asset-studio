# syntax=docker/dockerfile:1

FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma

RUN npm ci

COPY tsconfig.json ./
COPY src ./src

# Copy Prisma .node query engines into dist/ (tsc does not emit them).
RUN npx prisma generate && npm run build && \
    mkdir -p dist/generated/prisma && \
    find src/generated/prisma -maxdepth 1 -type f -name '*.node' -exec cp -t dist/generated/prisma/ {} + && \
    npm prune --omit=dev

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["node", "dist/server.js"]
