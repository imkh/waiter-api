var app = require('./express.js');
var cors = require('cors');
var config = require('config');
var http = require('./http');
var dotenv = require('dotenv');


var db = require('./models/Database.js');
var userModel = require('./models/User.js');
var eventModel = require('./models/Event.js');
var waitModel = require('./models/Wait.js');
var historyModel = require('./models/History.js');

var userRoutes = require('./controllers/UserController.js');
var eventRoutes = require('./controllers/EventController.js');
var waitRoutes = require('./controllers/WaitController.js');
var paymentRoutes = require('./controllers/PaymentController.js');

const serverConfig = config.get('server');

// There's no need to check if .env exists, dotenv will check this // for you. It will show a small warning which can be disabled when // using this in production.
dotenv.load();

var blacklist = []
var corsOptions = {
  origin: function (origin, callback) {
    if (blacklist.indexOf(origin) === -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },credentials: true
}

app.use(cors(corsOptions));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});


app.use('/user', userRoutes);
app.use('/event', eventRoutes);
app.use('/wait', waitRoutes);
app.use('/payment', paymentRoutes);

http.listen(serverConfig.port, function() {
    console.log('HTTP on port ' + serverConfig.port);
});

module.exports = app;
