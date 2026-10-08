# Dockerfile súper ligero (1 etapa) sirviendo la compilación lista del frontend
FROM nginx:alpine

# Copiar la configuración de Nginx con soporte para SPA (React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar el paquete compilado listo
COPY build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]