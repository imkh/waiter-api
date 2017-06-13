[![Build Status](https://img.shields.io/travis/waiter-project/waiter-api.svg?style=flat-square&branch=develop)](https://img.shields.io/travis/waiter-project/waiter-api)



# Waiter API

This repository contains the source code for the Waiter API.

## Documentation

The API documentation can be found here: http://docs.waiterapi.apiary.io/

## Mac OS X

### Installation

There might be problems with installation depending on your computer, in that case, good luck.

### Forever

'npm install forever -g'

### Homebrew

`/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"`

http://brew.sh/

### Node.js

`npm install nodejs`

### Mongodb

`brew install mongodb`

### Running

//

### MongoDB

`brew services start mongodb`

Before running application, don't forget to create the database.

Open mongo shell in a terminal:

`mongo`

Create the database, run the following command in mongo shell:

`use waiter-api`

### Application

``` bash
# install dependencies
npm install

# run application at localhost:5000
npm start

# test application API 
npm test
```
