# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install && \
    npm cache clean --force

# Stage 2: Runtime
FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache curl

COPY --from=builder /app/node_modules ./node_modules

COPY . .

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/_ok || exit 1

CMD ["sh", "-c", "NODE_ENV=production npx sequelize-cli db:migrate && NODE_ENV=production node server.js"]
