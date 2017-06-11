var Event = require('./../models/event');
var User = require('./../models/user');
var History = require('./../models/history');

var historyService = {};

historyService.addHistory = function(wait) {
    var newHistory = {
	event: {},
	client: {},
	waiters: [],
	wait: {},
	price: {}
    };

    newHistory.wait.queueStart = wait.queueStart;
    newHistory.wait.queueEnd = wait.queueEnd;
    newHistory.wait.duration = Math.ceil((Math.abs(wait.queueEnd.getTime()
						 - wait.queueStart.getTime())) / (1000 * 3600));

    newHistory.price.total = (newHistory.wait.duration / 60) + 9; // 
    newHistory.price.pricebyHours [0, 0, 0];

    Event.findById(wait.eventId, function (err, event) {
        if (err) {
	    console.log(err.message);
	    return ;
        }
	newHistory.event.name = event.name;
	newHistory.event.address = event.address;
	newHistory.event.location = event.location;

	User.findById(wait.clientId, function (err, client) {
            if (err) {
		console.log(err.message);
		return ;
            }
	    
	    newHistory.client.firstName = client.firstName;
	    newHistory.client.lastName = client.lastName;
	    newHistory.client.email = client.email;
	    
	    User.find().where('_id').in(wait.waitersIds).exec(function (err, waiters) {
		if (err) {
		    console.log(err.message);
		    return ;
		}
		for (var i = 0; i != waiters.length; i++) {
		    var waiter = {};

		    waiter.firstName = waiters[0].firstName;
		    waiter.lastName = waiters[0].lastName;
		    waiter.email = waiters[0].email;
		    newHistory.waiters.push(waiter);
		}

		History.create(newHistory, function(err, history) {
		    if (err) {
			console.log(err.message);
			return ;
		    }
		    console.log("history added");
		    return ;
		});	    
	    });
	});
    });
};

/* var historyService = require('./services/historyService.js');
 * var obj = {
 *     event: {
 * 	name: "tour effel",
 * 	address: "3 rue du giligili",
 * 	location: [1212121, 454845]
 *     },
 *     client: {
 * 	firstName: "samuel",
 * 	lastName: "joset",
 * 	email: "samuel.joset@gmail.com"
 *     },
 *     waiters: [
 * 	{
 * 	    firstName: "solal",
 * 	    lastName: "hagege",
 * 	    email: "solal.hagege@gmail.com"
 * 	},
 * 	{
 * 	    firstName: "ammar",
 * 	    lastName: "kerrou",
 * 	    email: "ammar.kerrou@gmail.com"
 * 	}
 *     ],
 *     wait: {
 * 	queueStart: Date.Now,
 * 	queueEnd: Date.Now,
 * 	queueDuration: 60, // in minute
 * 	state: 'payed'
 *     },
 *     price: {
 * 	total: 30,
 * 	pricebyHours: [10, 10, 10]
 *     }
 * };
 * 
 * historyService.addHistory(obj);*/

module.exports = historyService;
