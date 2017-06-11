var User = require('./../models/User');
var https = require('https');

var headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Authorization": "Basic " + process.env.ONESIGNAL_API_KEY
};
var options = {
    host: "onesignal.com",
    port: 443,
    path: "/api/v1/notifications",
    method: "POST",
    headers: headers
};

var notificationService = {};

notificationService.sendNotifications = function(usersIds, message) {
    var devices = [];
    User.find({}).where('_id').in(usersIds).select('email devices').exec(function (err, users) {
        if (err) {
            console.log(err.message);
            return ;
        }

        for (var i = 0; i !== users.length; i++) {
            devices = devices.concat(users[i].devices);
        }
        console.log(devices);

        var data = {
            app_id: process.env.ONESIGNAL_APP_ID,
            contents: {"en": message},
            include_player_ids: devices
        };


        var req = https.request(options, function(res) {
            res.on('data', function(data) {
                console.log("Response:");
                console.log(JSON.parse(data));
            });
        });

        req.on('error', function(e) {
            console.log("ERROR:");
            console.log(e);
        });

        req.write(JSON.stringify(data));
        req.end();
    });
};

module.exports = notificationService;
