# WaiterAPI
===========

# Mac OS X

## Installation

There might be problems with installation depending on your computer, in that case, good luck.

### Homebrew

```/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"```

http://brew.sh/

### Node.js

```brew install nodejs```

### Mongodb

```brew install mongodb```

## Running

### MongoDB

```brew services start mongodb```

Before running application, don't forget to create the database.

Open mongo shell in a terminal :

```mongo```

Create the database, run the following command in mongo shell :

```use waiter-api```

### Application

```node app.js```
