/**
 * Created by quentinhuang on 23/02/2017.
 */
/**
 * Created by quentinhuang on 03/02/2017.
 */
var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt');
var mongoose = require('mongoose');
var methodOverride = require('method-override');
var config = require('config');
var jwt = require('jsonwebtoken');


var http = require('./../http');
var io = require('socket.io')(http);

var historyService = require('./../services/historyService');
var notificationService = require('./../services/notificationService.js');

io.on('connection', function(socket){
    socket.on('waiter message', function(msg){
        console.log('message: ' + msg);
        io.emit('waiter message', msg);
    });
});

var bcryptConfig = config.get('bcrypt');
var tokenConfig = config.get('JWT');
var jsend = require('jsend');

const saltRounds = bcryptConfig.saltRounds;
const tokenSecret = tokenConfig.tokenSecret;

function makeid()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for(var i = 0; i < 20; i++ )
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
    mongoose.model('Wait').findById(id, function (err, wait) {
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

router.get('/:id', function(req, res) {
    mongoose.model('Wait').findById(req.id, function (err, wait) {
        if (err) {
            res.status(500).json({status: "fail", data: {message: 'internal server error'}});
            return ;
        }

        if (event === null) {
            res.status(404).json({status: "fail", data: {message: 'wait not found'}});
            return ;
        }
        res.status(200).jsend.success(wait);
    });
});


router.get('/', function(req, res) {
    mongoose.model('Wait').find({}, function (err, waits) {
        if (err) {
            res.status(500).json({status: "fail"});
            return ;
        }
        res.status(200).jsend.success(waits);
    });
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
    var numberOfWaiters = parseInt(res.req.body.numberOfWaiters);

    mongoose.model('User').findById(userId, function(err, user) {
        if (err) {
            res.status(500).jsend.fail('internal server error');
            return ;
        }
        if (user === null) {
            res.status(500).jsend.fail('user not found');
            return ;
        }
        mongoose.model('Event').findById(eventId, function(err, event) {
            if (err) {
                res.status(500).jsend.fail('internal server error');
                return ;
            }
            if (event === null) {
                res.status(404).jsend.fail('event not found');
                return ;
            }
            if (event.listOfWaiters.length < numberOfWaiters) {
                res.status(404).jsend.fail('not enough waiter');
                return ;
            }

            var newWait = {
                state: 'created',
                clientId: userId,
                eventId: eventId,
                eventName: event.name,
                nresponses: [],
                waitersIds: []
            };

            for (var i = 0; i !== numberOfWaiters; i++) {
                newWait.waitersIds.push(event.listOfWaiters.shift());
            }


            mongoose.model('Wait').create(newWait, function(err, wait) {
                if (err) {
                    if (err.errors) {
                        if (err.errors.userId)
                            causes.push(err.errors.userId.message)
                    }
                    res.status(500).jsend.fail({message: 'fail wait creation', causes: causes});
                    return ;
                }
                event.save(function(err) {
                    if (err) {
                        res.status(500).jsend.fail('internal server error');
                        return ;
                    }

                    notificationService.sendNotifications(newWait.waitersIds, "You have been requested for " + event.name + "!");

                    res.status(200).jsend.success(wait);
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

router.put('/:id/queue-start', function(req, res) {
    var waiterId = res.req.body.waiterId;

    mongoose.model('Wait').findOne({_id: req.id, waitersIds: waiterId, state: 'created'}, function(err, wait) {
        if (err) {
            res.status(500).json({status: 'fail', data: {message: 'internal server error'}});
            return ;
        }
        if (wait === null) {
            res.status(404).json({status: 'fail', data: {message: 'wait not found'}});
            return ;
        }

        var devices = wait.waitersIds.slice();
        devices.push(wait.clientId);

        wait.nresponses.push(waiterId);
        if (wait.nresponses.length === wait.waitersIds.length) {
            if (wait.waitersIds.length > 1) {
                notificationService.sendNotifications(devices, "All waiters arrived at " + wait.eventName + ". The wait can start!");
            } else {
                notificationService.sendNotifications(devices, "Your waiter arrived at " + wait.eventName + ". The wait can start!");
            }
            wait.nresponses = [];
            wait.state = 'queue-start';
//	    io.emit('waiter message', "queue started");
        }

        wait.save(function (err) {
            if (err) {
                res.status(500).json({status: 'fail', data: {message: 'internal server error'}});
                return;
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
            res.status(200).json({status: 'success', data: wait});
        });

    });
});

router.put('/:id/queue-done', function(req, res) {
    var waiterId = res.req.body.waiterId;

    mongoose.model('Wait').findOne({_id: req.id, waitersIds: waiterId, state: 'queue-start'}, function(err, wait) {
        if (err) {
            res.status(500).json({status: 'fail', data: {message: 'internal server error'}});
            return ;
        }
        if (wait === null) {
            res.status(404).json({status: 'fail', data: {message: 'wait not found'}});
            return ;
        }



        wait.nresponses.push(waiterId);
        if (wait.nresponses.length == wait.waitersIds.length) {
            wait.nresponses = [];
            wait.state = 'queue-done';
            // TODO[Notification]:: Get everyone to know how that the state has changed
        }

        wait.save(function (err) {
            if (err) {
                res.status(500).json({status: 'fail', data: {message: 'internal server error'}});
                return ;
            }

            // TODO:: send notifications
            res.status(200).json({status: 'success', data: wait});
        });

    });
});


router.put('/:id/generate-code', function(req, res) {
    var clientId = res.req.body.clientId;

    mongoose.model('Wait').findOne({_id: req.id, clientId: clientId, state: 'queue-done', confirmationCode: null}, function(err, wait) {
        if (err) {
            res.status(500).json({status: 'fail', data: {message: 'internal server error'}});
            return ;
        }
        if (wait === null) {
            res.status(404).json({status: 'fail', data: {message: 'wait not found'}});
            return ;
        }

        var code = makeid();
        var salt = bcrypt.genSaltSync(saltRounds);

        wait.confirmationCode = bcrypt.hashSync(code, salt);
        wait.save(function (err) {
            if (err) {
                res.status(500).json({status: 'fail', data: {message: 'internal server error'}});
                return ;
            }
            res.status(200).json({status: 'success', data: {code: code}});
        });
    });
});

router.put('/:id/validate', function(req, res) {
    var waiterId = res.req.body.waiterId;
    var code = res.req.body.code;

    mongoose.model('Wait').findOne({_id: req.id, waitersIds: waiterId, state: 'queue done', confirmationCode: { $ne: null }}, function(err, wait) {
        if (err) {
            res.status(500).json({status: 'fail', data: {message: 'internal server error'}});
            return ;
        }
        if (wait === null) {
            res.status(404).json({status: 'fail', data: {message: 'wait not found'}});
            return ;
        }
        if (!bcrypt.compareSync(code, wait.confirmationCode)) {
            res.status(500).json({status: 'fail', data: {message: 'invalid token'}});
            return ;
        }

        wait.nresponses.push(waiterId);
        if (wait.nresponses.length == wait.waitersIds.length) {
            wait.nresponses = [];
            wait.state = 'paid';
        }


        // TODO:: cmake transaction

        wait.save(function (err) {
            if (err) {
                res.status(500).json({status: 'fail', data: {message: 'internal server error'}});
                return ;
            }
            historyService.addHistory(wait);
            res.status(200).json({status: 'success', data: wait});
        });
    });
});

module.exports = router;
