FROM node:22-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --omit=dev

# Copiar código fuente
COPY . .

# Copiar .env.example como .env
# RUN cp .env.example .env

# Crear directorio de logs
RUN mkdir -p logs

# Exponer puerto
EXPOSE 3020

# Comando de inicio
CMD ["node", "src/server.js"]
