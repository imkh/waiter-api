var mongoose = require('mongoose');


var notificationService = {};

notificationService.sendNotifications = function(usersIds) {
    var devices = [];
    mongoose.model('User').find({}).where('_id').in(usersIds).select('email devices').exec(function (err, users) {
	if (err) {
	    console.log(err.message);
	    return ;
	}

	for (var i = 0; i != users.length; i++) {
	    devices = devices.concat(users[i].devices);
	}
	console.log(devices);
	// code here...
    });
    
};

module.exports = notificationService;
