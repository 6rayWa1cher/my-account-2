FROM node:16-alpine

WORKDIR /usr/src/app

# Install python and make
ENV PYTHONUNBUFFERED=1
RUN apk add --update --no-cache python3 build-base

# Install deps
COPY package*.json ./
RUN npm install

# Copy the app's code
COPY . /usr/src/app

EXPOSE 8080
CMD [ "npm", "start" ]