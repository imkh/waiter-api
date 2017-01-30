var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var db = require('./model/database.js');
var userModel = require('./model/user.js');
var mongoose = require('mongoose');
var userRoutes = require('./routes/user.js');
var config = require('config');

const serverConfig = config.get('server');

app.use('/user', userRoutes);

app.listen(serverConfig.port, function() {
    console.log('HTTP on port ' + serverConfig.port);
});

