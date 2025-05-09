FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --only=prod

COPY . .
EXPOSE 8888

CMD [ "node", "./bin/server" ]