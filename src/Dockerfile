FROM node:lts-alpine

WORKDIR /app

# Install NPM 7
RUN npm install --global npm@10

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install
