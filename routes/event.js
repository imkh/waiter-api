/**
 * Created by quentinhuang on 03/02/2017.
 */
var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var methodOverride = require('method-override');
var config = require('config');
var jwt = require('jsonwebtoken');
var jsend = require('jsend');


var tokenConfig = config.get('JWT');

const tokenSecret = tokenConfig.tokenSecret;

//@TODO remove callback hell !!!
//@TODO implement promise or wait !!!
//@TODO create named callback functions !!!

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

// Start: Middleware (1)
/**
 * Middleware verify event exists
 */
router.param('id', function(req, res, next, id) {
    var causes = [];

    mongoose.model('Event').findById(id, function (err, event) {
        if (err) {
            res.status(httpCodes.internalServerError).jsend.error({message: err.message});
            return ;
        }
        if (event === null) {
            causes.push('Event not found');
            res.status(httpCodes.notFound).jsend.fail({message: 'Event middleware failed', causes: causes});
            return ;
        }
        next();


        /* if (err) {
         *     console.log(id + ' was not found');
         *     res.status(404)
         *     var err = new Error('Not Found');
         *     err.status = 404;
         *     res.format({
         *         json: function(){
         *             res.status(404).json({status: "fail", data : { message: err.status  + ' ' + err}});
         res.status(httpCodes.notFound).jsend.fail({message: '', causes: causes});
         *         }
         *     });
         * } else {
         *     req.id = id;
         *     next();
         * }*/
    });
});
// End: Middleware (2)

/**
 * Route Create Event
 */
router.post('/', function(req, res) {
    var causes = [];

    var event = {
        name: res.req.body.name,
        description: res.req.body.description,
        address: res.req.body.address,
        lat: res.req.body.lat,
        long: res.req.body.long,
        date: res.req.body.date
    };

    mongoose.model('Event').create(event, function(err, createdEvent) {
        if (err) {
            if (err.errors) {
                if (err.errors.name)
                    causes.push(err.errors.name.message);
                if (err.errors.description)
                    causes.push(err.errors.description.message);
                if (err.errors.lat)
                    causes.push(err.errors.lat.message);
                if (err.errors.long)
                    causes.push(err.errors.long.message);
                if (err.errors.date)
                    causes.push(err.errors.date.message)
            }
            res.status(httpCodes.badRequest).jsend.fail({message: 'Create event failed', causes: causes});
            return ;
        }
        res.jsend.success(createdEvent);
    });
});

/**
 * Route Get One Event By ID
 */
router.get('/:id', function(req, res) {
    var causes = [];

    mongoose.model('Event').findById(req.params.id, function (err, event) {
        if (err) {
            res.status(httpCodes.internalServerError).jsend.error({message: err.message});
            return ;
        }
        if (event === null) {
            causes.push('Event not found');
            res.status(httpCodes.notFound).jsend.fail({message: 'Get event failed', causes: causes});
            return ;
        }
        res.jsend.success(event);
    });
});

/**
 * Route Get All Events
 */
router.get('/', function(req, res) {
    mongoose.model('Event').find({}, function (err, events) {
        if (err) {
            res.status(httpCodes.internalServerError).jsend.error({message: err.message});
            return ;
        }
        res.jsend.success(events);
    });
});

/**
 * Route Delete Event
 */
router.delete('/:id', function(req, res) {
    var causes = [];

    mongoose.model('Event').findById(req.params.id, function (err, event) {
        if (err) {
            res.status(httpCodes.badRequest).jsend.error({message: err.message});
            return ;
        }
        if (event === null) {
            causes.push('Event not found');
            res.status(httpCodes.notFound).jsend.fail({message: 'Delete event failed', causes: causes});
            return ;
        }

        event.remove(function (err) {
            if (err) {
                res.status(httpCodes.badRequest).jsend.error({message: err.message});
                return ;
            }
            res.jsend.success({});
        });
    });
});

// Start: Middleware (2)
/**
 * Middleware verify token
 */
router.use(function(req, res, next) {
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    if (token) {
        jwt.verify(token, tokenSecret, function(err, decoded) {
            if (err) {
                return res.json({status: "fail", data: {message: 'Failed to authenticate token.'}});
            } else {
                req.decoded = decoded;
                next();
            }
        });
    } else {
        return res.status(403).send({status: "fail", data: {message: 'No token provided.'}});
    }
});
// End: Middleware (2)

/**
 * Route Waiter Join Event
 */
router.put('/:id/join', function(req, res) {
    var causes = [];
    var userId = res.req.body.userId;

    mongoose.model('User').findById(userId, function (err, user) {
        if (err) {
            res.status(httpCodes.badRequest).jsend.error({message: err.message});
            return ;
        }
        if (user === null) {
            causes.push('User not found');
            res.status(httpCodes.notFound).jsend.fail({message: 'Join event failed', causes: causes});
            return ;
        }
        mongoose.model('Event').findById(req.params.id, function (err, event) {
            if (err) {
                res.status(httpCodes.badRequest).jsend.error({message: err.message});
                return ;
            }

            if (event === null) {
                causes.push('Event not found');
                res.status(httpCodes.notFound).jsend.fail({message: 'Join event failed', causes: causes});
                return ;
            }
            if (user.waiterCurrentEvent !== null) {
                causes.push('Waiter has already subscribed to an event');
                res.status(httpCodes.conflict).jsend.fail({message: 'Join event failed', causes: causes});
                return ;
            }



            user.update({waiterCurrentEvent: event._id }, function (err) {
                if (err) {
                    res.status(httpCodes.badRequest).jsend.error({message: err.message});
                    return ;
                }
                event.listOfWaiters.push(user._id);
                event.save(function (err) {
                    if (err) {
                        res.status(httpCodes.badRequest).jsend.error({message: err.message});
                        return ;
                    }
                    res.jsend.success({});
                });
            });
        });
    });
});

/**
 * Route Waiter Leave Event
 */
router.put('/:id/leave', function(req, res) {
    var causes = [];
    var userId = res.req.body.userId;

    mongoose.model('User').findById(userId, function (err, user) {
        if (err) {
            res.status(httpCodes.badRequest).jsend.error({message: err.message});
            return ;
        }
        if (user === null) {
            causes.push('User not found');
            res.status(httpCodes.notFound).jsend.fail({message: 'Leave event failed', causes: causes});
            return ;
        }
        mongoose.model('Event').findById(req.params.id, function (err, event) {
            if (err) {
                res.status(httpCodes.badRequest).jsend.error({message: err.message});
                return ;
            }

            if (event === null) {
                causes.push('Event not found');
                res.status(httpCodes.notFound).jsend.fail({message: 'Leave event failed', causes: causes});
                return ;
            }

            if (!user.waiterCurrentEvent) {
                causes.push("waiter hasn't subscribe an event");
                res.status(httpCodes.conflict).jsend.fail({message: 'Leave event failed', causes: causes});
                return ;
            }

            if (user.waiterCurrentEvent !== req.params.id) {
                causes.push("waiter hasn't subscribedd to this event");
                res.status(httpCodes.conflict).jsend.fail({message: 'Leave event failed', causes: causes});
                return ;
            }

            user.update({
                waiterCurrentEvent: null
            }, function (err) {
                if (err) {
                    res.status(httpCodes.badRequest).jsend.error({message: err.message});
                    return ;
                }
                event.listOfWaiters.remove(user._id);
                event.save(function (err) {
                    if (err) {
                        res.status(httpCodes.badRequest).jsend.error({message: err.message});
                        return ;
                    }
                    res.jsend.success({});
                });
            });
        });
    });
});

module.exports = router;
