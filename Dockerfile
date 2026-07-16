# Etapa 1: build del frontend
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# Etapa 2: servir el frontend con Nginx
FROM nginx:stable-alpine

# Copiar la configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos construidos desde la primera etapa
COPY --from=builder /app/build /usr/share/nginx/html

# Exponer el puerto HTTP
EXPOSE 80

# Arrancar Nginx
CMD ["nginx", "-g", "daemon off;"]