FROM node:latest AS base

RUN apt-get update -qq && apt-get -y install qt5-default libusb-1.0-0-dev psmisc # psmisc for killall which epsonscan2 needs for whatever reason?   

COPY epsonscan2.tar.gz ./
RUN tar -xvzf epsonscan2.tar.gz -C /tmp/ && /tmp/epsonscan2.deb/install.sh

WORKDIR /app/node

COPY package*.json ./

RUN npm install # --only=prod
COPY . .

# ENV HTTP_PORT=3003

#VOLUME /app/config
#VOLUME /app/scans
VOLUME scans

RUN mkdir -p /app/scans

# USER node
EXPOSE 3003



CMD ["npm","run", "start"]