/**
 * Created by quentinhuang on 23/02/2017.
 */
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

router.get('/:id', function(req, res) {
    mongoose.model('Wait').findById(req.id, function (err, wait) {
        if (err) {
            res.status(500).json({status: "fail", data: {message: 'internal server error'}});
        } else {
            if (event === null) {
                res.status(404).json({status: "fail", data: {message: 'wait not found'}});
            } else {
                res.json({status: "success", data: wait});
            }
        }
    });
});

router.get('/', function(req, res) {
    mongoose.model('Wait').find({}, function (err, waits) {
        if (err) {
            res.status(500).json({status: "fail"});
        } else {
            res.json({status: "success", data: waits});
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

router.post('/', function(req, res) {
    var causes = [];

    var userId = res.req.body.userId;
    var eventId = res.req.body.eventId;
    var numberOfWaiters = parseInt(res.req.body.numberOfWaiters);

    mongoose.model('User').findById(userId, function(err, user) {
        if (err) {
            res.status(500).json({status: "fail", data: {message: 'internal server error'}});
        } else if (user === null) {
            res.status(404).json({status: "fail", data: {message: 'user not found'}});
        } else {
            mongoose.model('Event').findById(eventId, function(err, event) {
                if (err) {
                    res.status(500).json({status: "fail", data: {message: 'internal server error'}});
                } else if (event === null) {
                    res.status(404).json({status: "fail", data: {message: 'event not found'}});
                } else if (event.listOfWaiters.length < numberOfWaiters) {
                    res.status(404).json({status: "fail", data: {message: 'not enough waiter'}});
                } else {
                    var newWait = {
                        state: 'not confirmed',
                        clientId: userId,
                        waitersIds: []
                    };

                    newWait.waitersIds.push(event.listOfWaiters[0]);
                    event.listOfWaiters.remove(event.listOfWaiters[0]);

                    mongoose.model('Wait').create(newWait, function(err, wait) {
                        if (err) {
                            if (err.errors) {
                                if (err.errors.userId)
                                    causes.push(err.errors.userId.message)
                            }
                            res.status(500).json({status: "fail", data: {message: 'fail wait creation', causes: causes}});
                        } else {
                            event.save(function(err) {
                                if (err) {
                                    res.status(500).json({status: "fail", data: {message: 'internal server error'}});
                                } else {
                                    res.status(200).json({status: "success", data: wait});
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});

module.exports = router;
