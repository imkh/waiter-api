var mongoose = require('mongoose');


var notificationService = {};

notificationService.sendNotifications = function(usersIds) {
    mongoose.model('User').find({}).where('_id').in(usersIds).select('email devices').exec(function (err, users) {
	if (err) {
	    console.log(err.message);
	    return ;
	}

	// code here...
    });
    
};

module.exports = notificationService;
