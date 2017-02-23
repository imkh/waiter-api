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

    var name = res.req.body.name;
    var description = res.req.body.description;
    var address = res.req.body.address;
    var long = res.req.body.long;
    var lat = res.req.body.lat;
    var date = res.req.body.date;

    mongoose.model('Event').create({
        name: name,
        description: description,
        address: address,
        long: long,
        lat: lat,
        date: date
    }, function(err, event) {
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
        } else {
            res.status(200).json({status: "success", data: event});
        }
    });
});

router.get('/:id', function(req, res) {
    mongoose.model('Event').findById(req.id, function (err, event) {
        if (err) {
            res.status(500).json({status: "fail", data: {message: 'internal server error'}});
        } else {
            if (event === null) {
                res.status(404).json({status: "fail", data: {message: 'event not found'}});
            } else {
                res.json({status: "success", data: event});
            }
        }
    });
});

router.get('/', function(req, res) {
    mongoose.model('Event').find({}, function (err, events) {
        if (err) {
            res.status(500).json({status: "fail"});
        } else {
            res.json({status: "success", data: events});
        }
    });
});

router.delete('/:id', function(req, res) {
    mongoose.model('Event').findById(req.id, function (err, event) {
        if (err) {
            res.status(500).json({status: "fail", data: {message: 'unknown event'}});
        } else {
            if (event === null) {
                res.status(404).json({status: "fail", data: {message: 'event not found'}});
            } else {
                event.remove(function (err) {
                    if (err) {
                        res.status(500).json({status: "fail", data: {message: 'Internal error'}});
                    } else {
                        res.json({status: "success"});
                    }
                });
            }
        }
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
            res.status(500).json({status: "fail"});
        } else {
            if (user === null) {
                res.status(404).json({status: "fail", data: 'user not found'});
            } else {
                mongoose.model('Event').findById(req.id, function (err, event) {
                    if (err) {
                        res.status(500).json({status: "fail", data: {message: 'internal server error'}});
                    } else {
                        if (event === null) {
                            res.status(404).json({status: "fail", data: {message: 'event not found'}});
                        } else {
                            user.update({
                                currentEvent: event._id
                            }, function (err) {
                                if (err) {
                                    res.status(500).json({status: "fail", data: {message: 'internal server error'}});
                                } else {
                                    event.listOfWaiters.push(user._id);
                                    event.save(function (err) {
                                        if (err) {
                                            res.status(500).json({status: "fail", data: {message: 'internal server error'}});
                                        } else {
                                            res.json({status: "success", data: {message: 'Joined event'}});
                                        }
                                    });
                                }
                            });
                        }
                    }
                });
            }
        }
    });
});

router.put('/:id/leave', function(req, res) {

    var userId = res.req.body.userId;

    mongoose.model('User').findById(userId, function (err, user) {
        if (err) {
            res.status(500).json({status: "fail"});
        } else {
            if (user === null) {
                res.status(404).json({status: "fail", data: 'user not found'});
            } else {
                mongoose.model('Event').findById(req.id, function (err, event) {
                    if (err) {
                        res.status(500).json({status: "fail", data: {message: 'internal server error'}});
                    } else {
                        if (event === null) {
                            res.status(404).json({status: "fail", data: {message: 'event not found'}});
                        } else {
                            user.update({
                                currentEvent: null
                            }, function (err) {
                                if (err) {
                                    res.status(500).json({status: "fail", data: {message: 'internal server error'}});
                                } else {
                                    event.listOfWaiters.remove(user._id);
                                    event.save(function (err) {
                                        if (err) {
                                            res.status(500).json({status: "fail", data: {message: 'internal server error'}});
                                        } else {
                                            res.json({status: "success", data: {message: 'Left event'}});
                                        }
                                    });
                                }
                            });
                        }
                    }
                });
            }
        }
    });
});

module.exports = router;
