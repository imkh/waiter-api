var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var ObjectId = require('mongoose').Types.ObjectId;
var methodOverride = require('method-override');
var config = require('config');
var jwt = require('jsonwebtoken');
var jsend = require('jsend');

var History = require('./../models/History');
var Wait = require('./../models/Wait');

var httpCodes = config.get('httpCodes');
var zoomDistanceRatio = config.get('zoomDistanceRatio');
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

    History.findById(id, function (err, history) {
        if (err) {
            res.status(httpCodes.internalServerError).jsend.error({message: err.message});
            return ;
        }
        if (history === null) {
            causes.push('History not found');
            res.status(httpCodes.notFound).jsend.fail({message: 'History  middleware failed', causes: causes});
            return ;
        }
        next();
    });
});

/**
 * Route Get One History By ID
 */
router.get('/:id', function(req, res) {
    var causes = [];

    History.findById(req.params.id, function (err, history) {
        if (err) {
            res.status(httpCodes.internalServerError).jsend.error({message: err.message});
            return ;
        }
        if (history === null) {
            causes.push('History not found');
            res.status(httpCodes.notFound).jsend.fail({message: 'Get history failed', causes: causes});
            return ;
        }
        res.jsend.success({history: history});
    });
});

/**
 * Route Get All Histories
 */
router.get('/', function(req, res) {
    History.find({}, function (err, histories) {
        if (err) {
            res.status(httpCodes.internalServerError).jsend.error({message: err.message});
            return ;
        }
        res.jsend.success({histories: histories});
    });
});

/**
 * Route Delete History
 */
router.delete('/:id/delete', function(req, res) {
    var causes = [];

    History.findById(req.params.id, function (err, history) {
        if (err) {
            res.status(httpCodes.badRequest).jsend.error({message: err.message});
            return ;
        }
        if (history === null) {
            causes.push('History not found');
            res.status(httpCodes.notFound).jsend.fail({message: 'Delete history failed', causes: causes});
            return ;
        }

        history.remove(function (err) {
            if (err) {
                res.status(httpCodes.badRequest).jsend.error({message: err.message});
                return ;
            }
            res.jsend.success({message: 'History successfully deleted'});
        });
    });
});

router.get('/user/:userId', function(req, res) {
    var causes = [];

    var query = {};
    var userType = req.body.token || req.query.token || req.headers['x-user-type'];
    if (userType === "client") {
        // query.client._id = new ObjectId(req.params.userId);
        query = {
            "client._id": req.params.userId
        };
    } else if (userType === "waiter") {
        query = {
            waiters: {
                $elemMatch: {
                    _id: new ObjectId(req.params.userId)
                }
            }
        };
    } else {
        causes.push('A user type in header is required');
        res.status(httpCodes.badRequest).jsend.fail({message: 'Get history failed', causes: causes});
        return ;
    }

    History.find(query, function (err, histories) {
        if (err) {
            res.status(httpCodes.internalServerError).jsend.error({message: err.message});
            return ;
        }

        if (histories === null) {
            causes.push('Histories not found');
            res.status(httpCodes.notFound).jsend.fail({message: 'Get histories failed', causes: causes});
            return ;
        }
        res.jsend.success({histories: histories});
    }).select('-__v');
});

router.put('/:id', function(req, res) {
  var causes = [];

  var notation = res.req.body.notation;

  
  var query = {
    _id: req.params.id
  };

  if (!res.req.body.notation)
    notation = 0;
  
  History.update(query, { $set: { 'notation.notation': notation }}, function () {
    res.jsend.success({message: 'History successfully updated'});
  });
});

module.exports = router;
