# Usamos una imagen ligera de Node.js
FROM node:18-alpine

# Directorio de trabajo
WORKDIR /app

# Copiamos archivos de dependencias
COPY package*.json ./

# Instalamos dependencias
RUN npm install

# Copiamos el resto del código
COPY . .

# Compilamos TypeScript (esto genera la carpeta /dist)
RUN npm run build

# Exponemos el puerto del Gerente
EXPOSE 3001

# Comando para iniciar el servicio
CMD ["npm", "start"]