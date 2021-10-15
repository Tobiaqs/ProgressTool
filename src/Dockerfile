FROM node:lts-alpine

WORKDIR /app/src

# Install NPM 7
RUN npm install --global npm@7

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install
