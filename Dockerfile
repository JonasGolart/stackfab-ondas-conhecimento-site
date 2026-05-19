# StackFab: Site "Ondas do Conhecimento" com Node.js + Postgres
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# Garantir a criação da pasta de uploads e permissões totais para o Multer
RUN mkdir -p uploads && chmod 777 uploads

EXPOSE 3000

CMD ["node", "server.js"]
