FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Puerto de la Cocina
EXPOSE 3002

CMD ["npm", "start"]