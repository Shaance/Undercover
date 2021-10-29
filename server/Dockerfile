FROM node:lts-slim

WORKDIR /usr/src/app

COPY package*.json ./

COPY tsconfig.json ./

RUN npm install

COPY ./src ./src

RUN npm run build

CMD npm start