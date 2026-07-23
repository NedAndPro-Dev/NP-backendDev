FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./

RUN npm ci --omit=dev

COPY backend/ .

COPY database/netandpro.sql /app/database/netandpro.sql

ENV NODE_ENV=production

EXPOSE 5000

CMD ["sh","-c","node import-db.js && npm start"]