var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var bcrypt = require('bcryptjs');
var mongoose = require('mongoose');
var ObjectId = require('mongoose').Types.ObjectId;
var methodOverride = require('method-override');
var config = require('config');
var jwt = require('jsonwebtoken');
var http = require('./../http');
var io = require('socket.io')(http);

var User = require('./../models/User');
var Event = require('./../models/Event');
var Wait = require('./../models/Wait');

var historyService = require('./../services/historyService');
var notificationService = require('./../services/notificationService.js');
var transactionService = require('./../services/transactionService.js');

var bcryptConfig = config.get('bcrypt');
var tokenConfig = config.get('JWT');
var jsend = require('jsend');
var httpCodes = config.get('httpCodes');

const saltRounds = bcryptConfig.saltRounds;
const tokenSecret = tokenConfig.tokenSecret;

io.on('connection', function(socket){
    socket.on('waiter message', function(msg){
        console.log('message: ' + msg);
        io.emit('waiter message', msg);
    });
});

function makeid()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    for(var i = 0; i < 5; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

router.use(methodOverride(function(req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        var method = req.body._method;
        delete req.body._method;
        return method;
    }
}));


router.use(jsend.middleware);
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({
    extended: true
}));

router.param('id', function(req, res, next, id) {
    Wait.findById(id, function (err, wait) {
        if (err) {
            console.log(id + ' was not found');
            res.status(404)
            var err = new Error('Not Found');
            err.status = 404;
            res.format({
                json: function(){
                    res.status(404).json({status: "fail", data : { message: err.status  + ' ' + err}});
                }
            });
        } else {
            req.id = id;
            next();
        }
    });
});

router.get('/socketTest', function(req, res) {
    io.emit('waiter message', "waiter is here");
    res.status(200).jsend.success({});
});

/**
 * Get One Wait (by ID)
 */
router.get('/:id', function(req, res) {
    var causes = [];

    Wait.findById(req.params.id, function (err, wait) {
        if (err) {
            res.status(httpCodes.internalServerError).jsend.error({message: err.message});
            return ;
        }

        if (wait === null) {
            causes.push('Wait not found');
            res.status(httpCodes.notFound).jsend.fail({message: 'Get wait failed', causes: causes});
            return ;
        }
        res.jsend.success({wait: wait});
    }).select('-__v');
});

/**
 * Get All Waits
 */
router.get('/', function(req, res) {
    Wait.find({}, function (err, waits) {
        if (err) {
            res.status(httpCodes.internalServerError).jsend.error({message: err.message});
            return ;
        }
        res.jsend.success({waits: waits});
    }).select('-__v');
});

/**
 * Get One Wait (by user ID, client or waiter)
 */
router.get('/user/:userId', function(req, res) {
    var causes = [];

    var query = {};
    var userType = req.body.token || req.query.token || req.headers['x-user-type'];
    if (userType == "client") {
        query = {clientId: new ObjectId(req.params.userId)};
    } else if (userType == "waiter") {
        query = {waitersIds: new ObjectId(req.params.userId)};
    } else {
        causes.push('A user type in header is required');
        res.status(httpCodes.badRequest).jsend.fail({message: 'Get wait failed', causes: causes});
        return ;
    }

    Wait.findOne(query, function (err, wait) {
        if (err) {
            res.status(httpCodes.internalServerError).jsend.error({message: err.message});
            return ;
        }

        if (wait === null) {
            causes.push('Wait not found');
            res.status(httpCodes.notFound).jsend.fail({message: 'Get wait failed', causes: causes});
            return ;
        }
        res.jsend.success({wait: wait});
    }).select('-__v');
});

//middleware start
/* router.use(function(req, res, next) {
 *     var token = req.body.token || req.query.token || req.headers['x-access-token'];
 *     if (token) {
 * 	jwt.verify(token, tokenSecret, function(err, decoded) {
 *             if (err) {
 * 		return res.json({status: "fail", data: {message: 'Failed to authenticate token.'}});
 *             } else {
 * 		req.decoded = decoded;
 * 		next();
 *             }
 * 	});
 *     } else {
 * 	return res.status(403).send({status: "fail", data: {message: 'No token provided.'}});
 *     }
 * });*/
//middleware end


//@TODO add push notification and multi waiters management

router.post('/', function(req, res) {
    var causes = [];

    var userId = res.req.body.userId;
    var eventId = res.req.body.eventId;
    var numberOfWaiters = res.req.body.numberOfWaiters;

    User.findById(userId, function(err, user) {
        if (err) {
            res.status(httpCodes.internalServerError).jsend.error({message: err.message});
            return ;
        }
        if (user === null) {
            causes.push('User not found');
            res.status(httpCodes.notFound).jsend.fail({message: 'Get user failed', causes: causes});
            return ;
        }
        Event.findById(eventId, function(err, event) {
            if (err) {
                res.status(httpCodes.internalServerError).jsend.error({message: err.message});
                return ;
            }
            if (event === null) {
                causes.push('Event not found');
                res.status(httpCodes.notFound).jsend.fail({message: 'Get event failed', causes: causes});
                return ;
            }
            if (event.listOfWaiters.length < numberOfWaiters) {
                causes.push('Not enough waiters joined this event');
                res.status(httpCodes.conflict).jsend.fail({message: 'Create wait failed', causes: causes});
                return ;
            }

            var newWait = {
                state: 'created',
                clientId: userId,
                eventId: eventId,
                eventName: event.name,
                eventLocation: event.location,
                nresponses: [],
                waitersIds: []
            };

            for (var i = 0; i !== numberOfWaiters; i++) {
                newWait.waitersIds.push(event.listOfWaiters.shift());
            }

            Wait.create(newWait, function(err, wait) {
                if (err) {
                    if (err.errors) {
                        if (err.errors.userId)
                            causes.push(err.errors.userId.message)
                    }
                    res.status(httpCodes.badRequest).jsend.error({message: 'Create wait failed', causes: causes});
                    return ;
                }
                event.save(function(err) {
                    if (err) {
                        res.status(httpCodes.internalServerError).jsend.error({message: err.message});
                        return ;
                    }

                    notificationService.sendNotifications(newWait.waitersIds, "You have been requested for " + event.name + "!");

                    res.status(httpCodes.created).jsend.success({wait: wait});
                });
            });

        });
    });
});

/* router.get('/not-confirmed/:waiterId/waiter', function(req, res) {
 *     var waiterId = req.params.waiterId;
 * 
 *     mongoose.model('Wait').findOne({state: 'not_confirmed', waitersIds: waiterId}, function(err, wait) {
 *         if (err) {
 *             res.status(500).json({status: 'fail', data: {message: 'internal server error'}});
 *         } else if (wait === null) {
 *             res.status(404).json({status: 'fail', data: {message: 'wait not found'}});
 *         } else {
 *             res.status(200).json({status: 'success', data: wait});
 *         }
 *     });
 * });
 * 
 * router.get('/not-confirmed/:clientId/client', function(req, res) {
 *     var clientId = req.params.clientId;
 * 
 *     mongoose.model('Wait').findOne({state: 'not confirmed', clientId: clientId}, function(err, wait) {
 *         if (err) {
 *             res.status(500).json({status: 'fail', data: {message: 'internal server error'}});
 *         } else if (wait === null) {
 *             res.status(404).json({status: 'fail', data: {message: 'wait not found'}});
 *         } else {
 *             res.status(200).json({status: 'success', data: wait});
 *         }
 *     });
 * });*/

/* router.put('/:id/accept', function(req, res) {
 *     mongoose.model('Wait').findById(req.id, function(err, wait) {
 *         if (err) {
 *             res.status(500).json({status: 'fail', data: {message: 'internal server error'}});
 * 	    return ;
 *         }
 * 	if (wait === null) {
 *             res.status(404).json({status: 'fail', data: {message: 'wait not found'}});
 * 	    return ;
 *         }
 * 	wait.nresponses++;
 * 	if (wait.nresponses == wait.waitersIds.length) {
 *             wait.state = 'accepted';
 * 	}
 *         wait.save(function (err) {
 *             if (err) {
 *                 res.status(500).json({status: 'fail', data: {message: 'internal server error'}});
 * 		return ;
 *             }
 * 
 *             res.status(200).json({status: 'success', data: wait});
 *         });
 * 
 *     });
 * });*/

/* router.put('/:id/reject', function(req, res) {
 *     mongoose.model('Wait').findById(req.id, function(err, wait) {
 *         if (err) {
 *             res.status(500).json({status: 'fail', data: {message: 'internal server error'}});
 *         } else if (wait === null) {
 *             res.status(404).json({status: 'fail', data: {message: 'wait not found'}});
 *         } else {
 *             wait.state = 'rejected';
 *             wait.save(function (err) {
 *                 if (err) {
 *                     res.status(500).json({status: 'fail', data: {message: 'internal server error'}});
 *                 } else {
 *                     mongoose.model('User').findById(wait.waitersIds[0], function (err, waiter) {
 *                         if (err) {
 *                             res.status(500).json({status: 'fail', data: {message: 'internal server error'}});
 *                         } else if (waiter === null) {
 *                             res.status(404).json({status: 'fail', data: {message: 'waiter not found'}});
 *                         } else {
 *                             waiter.currentEvent = 'null';
 *                             waiter.save(function (err) {
 *                                 if (err) {
 *                                     res.status(500).json({status: 'fail', data: {message: 'internal server error'}});
 *                                 } else {
 *                                     res.status(200).json({status: 'success', data: wait});
 *                                 }
 *                             });
 *                         }
 *                     });
 *                 }
 *             });
 *         }
 *     });
 * });*/

router.put('/:id/queue-start/:waiterId', function(req, res) {
    var waiterId = req.params.waiterId;
    var causes = [];

    Wait.findOne({_id: req.id, waitersIds: waiterId, state: 'created'}, function(err, wait) {
        if (err) {
            res.status(httpCodes.internalServerError).jsend.error({message: err.message});
            return ;
        }
        if (wait === null) {
            causes.push('Wait not found');
            res.status(httpCodes.notFound).jsend.fail({message: 'Get wait failed', causes: causes});

            return ;
        }

        var devices = wait.waitersIds.slice();
        devices.push(wait.clientId);
        // Remove waiterId's device
        var index = devices.map(function(x) {return x.toString(); }).indexOf(waiterId);
        if (index > -1) {
            devices.splice(index, 1);
        }

        wait.nresponses.push(waiterId);
        if (wait.nresponses.length === wait.waitersIds.length) {
            if (wait.waitersIds.length > 1) {
                notificationService.sendNotifications(devices, "All waiters arrived at " + wait.eventName + ". The wait can start!");
            } else {
                notificationService.sendNotifications(devices, "Your waiter arrived at " + wait.eventName + ". The wait can start!");
            }
            wait.nresponses = [];
            wait.state = 'queue-start';
            wait.queueStart = Date.now();
//	    io.emit('waiter message', "queue started");
        }

        wait.save(function (err) {
            if (err) {
                res.status(httpCodes.internalServerError).jsend.error({message: err.message});
                return ;
            }
            if (wait.state === 'created' && wait.waitersIds.length > 1 && wait.nresponses.length < wait.waitersIds.length) {
                var message = "";
                if (wait.nresponses.length === 1) {
                    message = "The first waiter arrived at " + wait.eventName + ". Only " + (wait.waitersIds.length - wait.nresponses.length) + " left!";
                } else {
                    message = wait.nresponses.length + "/" + wait.waitersIds.length + " waiter arrived at " + wait.eventName + ". Only " + (wait.waitersIds.length - wait.nresponses.length) + " left!";
                }
                notificationService.sendNotifications(devices, message);
            }

//	    io.emit('waiter message', wait.nresponses.length + "/" + wait.waitersIds.length + " in state of queue-start");
            res.jsend.success({wait: wait});
        });

    });
});

router.put('/:id/queue-done/:waiterId', function(req, res) {
    var waiterId = req.params.waiterId;
    var causes = [];

    Wait.findOne({_id: req.id, waitersIds: waiterId, state: 'queue-start'}, function(err, wait) {
        if (err) {
            res.status(httpCodes.internalServerError).jsend.error({message: err.message});
            return ;
        }
        if (wait === null) {
            causes.push('Wait not found');
            res.status(httpCodes.notFound).jsend.fail({message: 'Get wait failed', causes: causes});
            return ;
        }


        var devices = wait.waitersIds.slice();
        devices.push(wait.clientId);
        // Remove waiterId's device
        var index = devices.map(function(x) {return x.toString(); }).indexOf(waiterId);
        if (index > -1) {
            devices.splice(index, 1);
        }

        wait.nresponses.push(waiterId);
        if (wait.nresponses.length === wait.waitersIds.length) {
            if (wait.waitersIds.length > 1) {
                notificationService.sendNotifications(devices, "All waiters have finished there wait at " + wait.eventName);
            } else {
                notificationService.sendNotifications(devices, "Your waiter has finished his wait at " + wait.eventName);
            }

            wait.nresponses = [];
            wait.state = 'queue-done';
            wait.queueEnd = Date.now();
        }

        wait.save(function (err) {
            if (err) {
                res.status(httpCodes.internalServerError).jsend.error({message: err.message});
                return ;
            }
            if (wait.state === 'queue-start' && wait.waitersIds.length > 1 && wait.nresponses.length < wait.waitersIds.length) {
                var message = "";
                if (wait.nresponses.length === 1) {
                    message = "The first waiter finished his wait at " + wait.eventName + ". Only " + (wait.waitersIds.length - wait.nresponses.length) + " left!";
                } else {
                    message = wait.nresponses.length + "/" + wait.waitersIds.length + " waiter have finished there wait at " + wait.eventName + ". Only " + (wait.waitersIds.length - wait.nresponses.length) + " left!";
                }
                notificationService.sendNotifications(devices, message);
            }


            // TODO:: send notifications
            res.jsend.success({wait: wait});
        });

    });
});


router.put('/:id/generate-code/:clientId', function(req, res) {
    var clientId = req.params.clientId;
    var causes = [];

    Wait.findOne({_id: req.id, clientId: clientId, state: 'queue-done'}, function(err, wait) {
        if (err) {
            res.status(httpCodes.internalServerError).jsend.error({message: err.message});
            return ;
        }
        if (wait === null) {
            causes.push('Wait not found');
            res.status(httpCodes.notFound).jsend.fail({message: 'Get wait failed', causes: causes});
            return ;
        }

        var code = makeid();
        /* var salt = bcrypt.genSaltSync(saltRounds);*/

        /* wait.confirmationCode = bcrypt.hashSync(code, salt);*/
	wait.confirmationCode = code;
        wait.save(function (err) {
            if (err) {
                res.status(httpCodes.internalServerError).jsend.error({message: err.message});
                return ;
            }
            res.jsend.success({code: code});
        });
    });
});

router.put('/:id/validate', function(req, res) {
    var waiterId = res.req.body.waiterId;
    var code = res.req.body.code;
    var causes = [];

    Wait.findOne({_id: req.id, waitersIds: waiterId, state: 'queue-done', confirmationCode: { $ne: null }}, function(err, wait) {
        if (err) {
            res.status(httpCodes.internalServerError).jsend.error({message: err.message});
            return ;
        }
        if (wait === null) {
            causes.push('Wait not found');
            res.status(httpCodes.notFound).jsend.fail({message: 'Get wait failed', causes: causes});
            return ;
        }
        if (code.valueOf() !== wait.confirmationCode.valueOf()) {
            causes.push('Invalid code');
            res.status(httpCodes.internalServerError).jsend.fail({message: 'Get wait failed', causes: causes});
            return ;
        }

        wait.nresponses.push(waiterId);
        if (wait.nresponses.length == wait.waitersIds.length) {
            wait.nresponses = [];
            wait.state = 'paid';
        }

	// TODO:: remettre les waiter dans la queue
        // TODO:: cmake transaction

        wait.save(function (err) {
            if (err) {
                res.status(httpCodes.internalServerError).jsend.error({message: err.message});
                return ;
            }
            historyService.addHistory(wait);
            transactionService.makeTransactionsForAWait(wait);
            res.jsend.success({wait: wait});
        });
    });
});

module.exports = router;
