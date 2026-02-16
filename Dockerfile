# Frontend Dockerfile
FROM node:18-alpine AS build

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Build de producción
RUN npm run build

# Etapa de producción con Nginx
FROM nginx:alpine

# Copiar archivos build al servidor Nginx
COPY --from=build /app/dist/ligas-barriales-frontend /usr/share/nginx/html

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
