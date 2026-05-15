# StackFab: Site "Ondas do Conhecimento" com Node.js + Postgres
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
