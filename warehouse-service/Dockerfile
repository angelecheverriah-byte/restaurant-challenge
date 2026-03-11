FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Puerto de la Bodega
EXPOSE 3003

CMD ["npm", "start"]