var express = require('express');

var app = express();

var db = require('./model/database.js');
var userModel = require('./model/user.js');
var eventModel = require('./model/event.js');
var userRoutes = require('./routes/user.js');
var eventRoutes = require('./routes/event.js');
var config = require('config');

const serverConfig = config.get('server');

app.use('/user', userRoutes);
app.use('/event', eventRoutes);

app.listen(serverConfig.port, function() {
    console.log('HTTP on port ' + serverConfig.port);
});

module.exports = app;
