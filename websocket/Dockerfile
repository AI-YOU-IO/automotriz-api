FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY websocketServer.js .

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["node", "websocketServer.js"]
