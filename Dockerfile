# Stage 1: Build TypeScript
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src ./src
COPY contract_abi.json contract_config.json ./
RUN npm run build

# Stage 2: Production
FROM node:22-alpine AS runner
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/contract_abi.json /app/contract_config.json ./

ENV NODE_ENV=production
EXPOSE 8900

ENTRYPOINT ["node", "dist/index.js"]
