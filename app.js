var express = require('express');

var app = express();
var cors = require('cors');


var db = require('./model/database.js');
var userModel = require('./model/user.js');
var eventModel = require('./model/event.js');
var waitModel = require('./model/wait.js');
var userRoutes = require('./routes/user.js');
var eventRoutes = require('./routes/event.js');
var waitRoutes = require('./routes/wait.js');
var config = require('config');

const serverConfig = config.get('server');

app.use(cors());
app.use('/user', userRoutes);
app.use('/event', eventRoutes);
app.use('/wait', waitRoutes);

app.listen(serverConfig.port, function() {
    console.log('HTTP on port ' + serverConfig.port);
});

module.exports = app;
