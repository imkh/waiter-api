var app = require('./express');

/* var app = express();*/
var cors = require('cors');


var db = require('./models/database.js');
var userModel = require('./models/user.js');
var eventModel = require('./models/event.js');
var waitModel = require('./models/wait.js');
var historyModel = require('./models/history.js');

var userRoutes = require('./routes/user.js');
var eventRoutes = require('./routes/event.js');
var waitRoutes = require('./routes/wait.js');

var config = require('config');

var http = require('./http');
/* var io = require('socket.io')(http);*/

var dotenv = require('dotenv');
// There's no need to check if .env exists, dotenv will check this // for you. It will show a small warning which can be disabled when // using this in production.
dotenv.load();

const serverConfig = config.get('server');

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

app.use(cors());
app.use('/user', userRoutes);
app.use('/event', eventRoutes);
app.use('/wait', waitRoutes);


http.listen(serverConfig.port, function() {
    console.log('HTTP on port ' + serverConfig.port);
});

module.exports = app;
