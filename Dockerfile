# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production Stage
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY --from=builder /app/dist ./dist
# Copiar schema.sql caso seja necessário rodar manualmente ou via script futuro
COPY --from=builder /app/src/database/schema.sql ./src/database/schema.sql

EXPOSE 3000

CMD ["npm", "start"]
