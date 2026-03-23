FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

RUN mkdir -p logs

ENV NODE_ENV=production
ENV PORT=3020

EXPOSE 3020

CMD ["node", "src/server.js"]