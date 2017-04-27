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

router.param('id', function(req, res, next, id) {
    mongoose.model('Event').findById(id, function (err, event) {
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
                    causes.push(err.errors.name.message)
                if (err.errors.description)
                    causes.push(err.errors.description.message)
                if (err.errors.lat)
                    causes.push(err.errors.lat.message)
                if (err.errors.long)
                    causes.push(err.errors.long.message)
                if (err.errors.date)
                    causes.push(err.errors.date.message)
            }
            res.status(500).json({status: "fail", data: {message: 'fail event creation', causes: causes}});
	    return ;
        }
	res.status(200).jsend.success(createdEvent);
    });
});

router.get('/:id', function(req, res) {
    mongoose.model('Event').findById(req.id, function (err, event) {
        if (err) {
	    res.status(500).jsend.fail('internal server error');
	    return ;
        }
        if (event === null) {
	    res.status(404).jsend.fail('event not found');
	    return ;
        }
        res.status(200).jsend.success(event);
    });
});

router.get('/', function(req, res) {
    mongoose.model('Event').find({}, function (err, events) {
        if (err) {
	    res.status(500).jsend.fail('internal server error');
	    return ;
        }
        res.status(200).jsend.success(events);
    });
});

router.delete('/:id', function(req, res) {
    mongoose.model('Event').findById(req.id, function (err, event) {
        if (err) {
	    res.status(500).jsend.fail('internal server error');
	    return ;
        }
        if (event === null) {
	    res.status(404).jsend.fail('event not found');
	    return ;
        }

        event.remove(function (err) {
            if (err) {
		res.status(500).jsend.fail('internal server error');
		return ;
            }
	    res.status(200).jsend.success({});
        });
    });
});

//middleware start
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
//middleware end

router.put('/:id/join', function(req, res) {
    
    var userId = res.req.body.userId;
    
    mongoose.model('User').findById(userId, function (err, user) {
        if (err) {
	    res.status(500).jsend.fail('internal server error');
	    return ;
        }

        if (user === null) {
	    res.status(404).jsend.fail('user not found');
	    return ;
        }
        mongoose.model('Event').findById(req.id, function (err, event) {
            if (err) {
		res.status(500).jsend.fail('internal server error');
		return ;
            }

            if (event === null) {
		res.status(404).jsend.fail('user not found');
		return ;
            }
	    if (user.waiterCurrentEvent != null) {
		res.status(406).jsend.fail('waiter has already subscribded to an event');
		return ;
	    }



            user.update({waiterCurrentEvent: event._id }, function (err) {
                if (err) {
		    res.status(500).jsend.fail('internal server error ' + err);
		    return ;
                }
                event.listOfWaiters.push(user._id);
                event.save(function (err) {
                    if (err) {
			res.status(500).jsend.fail('internal server error');
			return ;
                    }
		    res.status(200).jsend.success({});
                });
            });
        });
    });
});

router.put('/:id/leave', function(req, res) {
    
    var userId = res.req.body.userId;
    
    mongoose.model('User').findById(userId, function (err, user) {
        if (err) {
	    res.status(500).jsend.fail('internal server error');
	    return ;
        }
        if (user === null) {
	    res.status(404).jsend.fail('user not found');
	    return ;
        }
        mongoose.model('Event').findById(req.id, function (err, event) {
            if (err) {
		res.status(500).jsend.fail('internal server error');
		return ;
            }
	    
            if (event === null) {
		res.status(404).jsend.fail('event not found');
		return ;
            }

	    if (!user.waiterCurrentEvent) {
		res.status(406).jsend.fail("waiter hasn't subcribe an event");
		return ;
	    }

	    if (user.waiterCurrentEvent != req.id) {
		res.status(406).jsend.fail("waiter hasn't subcribe to this event");
		return ;
	    }
	    
            user.update({
                waiterCurrentEvent: null
            }, function (err) {
                if (err) {
		    res.status(500).jsend.fail('internal server error');
		    return ;
                }
                event.listOfWaiters.remove(user._id);
                event.save(function (err) {
                    if (err) {
			res.status(500).jsend.fail('internal server error');
			return ;
                    }
                    res.json({status: "success", data: {message: 'Left event'}}); 
                });
            });
        });
    });
});

module.exports = router;
