/**
 * Created by quentinhuang on 24/02/2017.
 */
var express = require('express');

var app = express();

var db = require('./model/database.js');
var userModel = require('./model/user.js');
var eventModel = require('./model/event.js');
var waitModel = require('./model/wait.js');
var config = require('config');

const serverConfig = config.get('wait-socket-server');

var http = require('http').Server(app);
var io = require('socket.io')(http);

io.on('connection', function(socket) {

    socket.on('disconnect', function() {
        socket.broadcast.emit('marker down', socket.id);
    });

    socket.on('marker down', function() {
        socket.broadcast.emit('marker down', socket.id);
    });

    socket.on('radar', function() {
        socket.broadcast.emit('radar');
    });

    socket.on('marker down', function() {
        socket.broadcast.emit('marker down', socket.id);
    });

    socket.on('update coordinates', function(latlng) {
        socket.broadcast.emit('broadcast coordinates', [socket.id, latlng])
    });

});

http.listen(serverConfig.port, function() {
    console.log('Wait socket server alive on port ' + serverConfig.port);
});
