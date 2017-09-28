FROM node:7.10

# (1) Need to do this before creating app directory because of bcrypt compiling in linux
# Install app dependencies
ADD package.json /
WORKDIR /
RUN npm install

# (2)
# Create app directory
RUN mkdir -p /app
WORKDIR /app

# Bundle app source
ADD . /app

EXPOSE 5000

CMD [ "npm", "start" ]
