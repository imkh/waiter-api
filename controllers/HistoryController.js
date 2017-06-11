var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var methodOverride = require('method-override');
var config = require('config');
var jwt = require('jsonwebtoken');
var jsend = require('jsend');

var History = require('./../models/History');

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
        if (event === null) {
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

    mongoose.model('History').findById(req.params.id, function (err, history) {
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

module.exports = router;
