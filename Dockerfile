# Dockerfile de 1 sola etapa sirviendo el build pre-compilado de React
FROM nginx:alpine

# Configuración Nginx para rutas React (SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar la carpeta compilada build/
COPY build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]