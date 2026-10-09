# Etapa 1: build del frontend
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
ENV GENERATE_SOURCEMAP=false
RUN npm run build

# Etapa 2: servir el frontend con Nginx
FROM nginx:alpine

# Configuración personalizada de Nginx para React Router (SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar el build generado en la etapa 1
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]