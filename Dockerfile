# Etapa 1: construir el frontend
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# Etapa 2: ejecutar el servidor Node.js (con el frontend ya compilado)
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev

# Copiamos los archivos del build (frontend ya compilado)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server

# Copiamos cualquier otro archivo de configuración necesario
COPY --from=builder /app/*.js ./
COPY --from=builder /app/.env ./

# Exponemos el puerto en el que corre tu app
EXPOSE 3000

# Arrancamos el servidor Node
CMD ["node", "server/index.js"]