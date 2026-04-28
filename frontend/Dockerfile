FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 5173

CMD ["npx", "serve", "-s", "dist", "-l", "5173"]
