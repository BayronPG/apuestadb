FROM node:20-alpine

WORKDIR /repo

COPY backend/package.json backend/package-lock.json ./backend/
RUN npm ci --prefix backend --omit=dev

COPY backend/config ./backend/config
COPY database ./database

CMD ["node", "/repo/database/bootstrap/azure-data-init.js"]
