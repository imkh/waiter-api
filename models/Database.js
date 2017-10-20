// Bring Mongoose into the app
var mongoose = require('mongoose');
var config = require('config');

const dd = require('dump-die');
const mongoConfig = config.get('mongo');

/**
 * Start MongoDB Docker Connection
 */
var MONGO_DB_URL;
var DOCKER_DB_PORT = process.env.DOCKER_DB_PORT;
if (DOCKER_DB_PORT) {
    // MONGO_DB_URL = DOCKER_DB_PORT.replace( 'tcp', 'mongodb' ) + '/app';
    MONGO_DB_URL = 'mongodb://db:' + DOCKER_DB_PORT + '/app';
} else {
    MONGO_DB_URL = mongoConfig.URL;
}

// Use Mongo DB URI Heroku
if (process.env.MONGODB_URI) {
    MONGO_DB_URL = process.env.MONGODB_URI
}

// console.log('process = ' + dd(process.env));
// console.log("DOCKER_DB = " + DOCKER_DB);
// console.log("MONGO_DB = " + MONGO_DB);

var retry = 0;
mongoose.connect(MONGO_DB_URL);
/**
 * End MongoDB Docker Connection
 */


// Create the database connection
// mongoose.connect(mongoConfig.URL);

// CONNECTION EVENTS
// When successfully connected
mongoose.connection.on('connected', function () {
    console.log('[CONNECTION] Mongoose default connection open to ' + MONGO_DB_URL);
});

// If the connection throws an error
mongoose.connection.on('error', function (err) {
    console.log('[ERROR] Mongoose default connection error: ' + err);
});

// When the connection is disconnected
mongoose.connection.on('disconnected', function () {
    console.log('[DISCONNECTED] Mongoose default connection disconnected');
});

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', function() {
    mongoose.connection.close(function () {
        console.log('[DISCONNECTED] Mongoose default connection disconnected through app termination');
        process.exit(0);
    });
});

// BRING IN YOUR SCHEMAS & MODELS // For example
// require('./../model/team');
