var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var db = require('./model/database.js');
var userModel = require('./model/user.js');
var mongoose = require('mongoose');
var userRoutes = require('./routes/user.js');

app.use('/user', userRoutes);

app.listen(3000, function() {
    console.log('HTTP on port 3000');
});

