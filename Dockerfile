FROM oven/bun:1 AS build-deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM oven/bun:1 AS prod-deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM oven/bun:1 AS builder
WORKDIR /app
COPY . ./
COPY --from=build-deps /app/node_modules ./node_modules
RUN bun run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
COPY package.json ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
CMD ["npm", "run", "start"]