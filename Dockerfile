FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN apk add --no-cache chromium

EXPOSE 9090

CMD [ "node", "index.js" ]
