# Etapa 1: build del frontend
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# Etapa 2: ejecutar el servidor Node.js
FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev --legacy-peer-deps
COPY --from=builder /app/build ./build
COPY --from=builder /app/server ./server
COPY --from=builder /app/*.js ./
COPY --from=builder /app/.env ./

EXPOSE 3000
CMD ["node", "server/index.js"]