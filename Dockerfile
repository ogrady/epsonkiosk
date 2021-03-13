FROM node:latest AS base

RUN apt-get update -qq && apt-get -y install qt5-default libusb-1.0-0-dev psmisc # psmisc for killall which epsonscan2 needs for whatever reason?   

COPY epsonscan2.tar.gz ./
RUN tar -xvzf epsonscan2.tar.gz -C /tmp/ && /tmp/epsonscan2.deb/install.sh

WORKDIR /app/node

COPY package*.json ./

RUN npm install # --only=prod
COPY . .

RUN mkdir -p /app/scans
RUN mkdir -p /app/config

CMD ["npm","run", "start"]