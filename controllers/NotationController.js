var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var methodOverride = require('method-override');
var config = require('config');
var jsend = require('jsend');

var User = require('./../models/User');
var Notation = require('./../models/Notation');

var httpCodes = config.get('httpCodes');


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
  
  Notation.findById(id, function (err, notation) {
    if (err) {
      res.status(httpCodes.internalServerError).jsend.error({message: err.message});
      return ;
    }
    if (notation === null) {
      causes.push('Notation not found');
      res.status(httpCodes.notFound).jsend.fail({message: 'Notation middleware failed', causes: causes});
      return ;
    }
    next();
  });
});

/**
 * Route Create Notation
 */
router.post('/create', function(req, res) {
  var causes = [];

  var notation = {
    clientId: res.req.body.clientId,
    waiterId: res.req.body.waiterId,
    waitId: res.req.body.waitId,
    notation: res.req.body.notation,
    comment: res.req.body.comment  
  };

  Notation.create(notation, function(err, createdNotation) {
    if (err) {
      if (err.errors) {
        if (err.errors.clientId)
          causes.push(err.errors.clientId.message);
        if (err.errors.waiterId)
          causes.push(err.errors.description.waiterId);
        if (err.errors.waitId)
          causes.push(err.errors.location.waitId);
        if (err.errors.notation)
          causes.push(err.errors.notation);
	if (err.errors.comment)
          causes.push(err.errors.comment);
      }
      res.status(httpCodes.badRequest).jsend.fail({message: 'Create notation failed', causes: causes});
      return ;
    }

    var response = {
      notation: createdNotation
    };
    res.status(httpCodes.created).jsend.success(response);
  });
});

/**
 * Route Get One Notation By ID
 */
router.get('/:id', function(req, res) {
  var causes = [];
  
  Notation.findById(req.params.id, function (err, notation) {
    if (err) {
      res.status(httpCodes.internalServerError).jsend.error({message: err.message});
      return ;
    }
    if (notation === null) {
      causes.push('Notation not found');
      res.status(httpCodes.notFound).jsend.fail({message: 'Get notation failed', causes: causes});
      return ;
    }
    res.jsend.success({notation: notation});
  }).select('-__v');
});

/**
 * Route Get All Notations
 */
router.get('/', function(req, res) {
  Notation.find({}, function (err, notations) {
    if (err) {
      res.status(httpCodes.internalServerError).jsend.error({message: err.message});
      return ;
    }
    res.jsend.success({notations: notations});
  }).select('-__v');
});

/**
 * Route Delete Notation
 */
router.delete('/:id/delete', function(req, res) {
  var causes = [];
  
  Notation.findById(req.params.id, function (err, notation) {
    if (err) {
      res.status(httpCodes.badRequest).jsend.error({message: err.message});
      return ;
    }
    if (notation === null) {
      causes.push('Notation not found');
      res.status(httpCodes.notFound).jsend.fail({message: 'Delete notation failed', causes: causes});
      return ;
    }

    notation.remove(function (err) {
      if (err) {
        res.status(httpCodes.badRequest).jsend.error({message: err.message});
        return ;
      }
      res.jsend.success({message: 'Notation successfully deleted'});
    });
  });
});

// Start: Middleware (2)
/**
 * Middleware verify token
 */
/* router.use(function(req, res, next) {
 *     var token = req.body.token || req.query.token || req.headers['x-access-token'];
 *     if (!token) {
 *         res.status(httpCodes.badRequest).jsend.fail({message: 'No token provided.'});
 *         return ;
 *     }
 *     jwt.verify(token, tokenSecret, function(err, decoded) {
 *         if (err) {
 *             res.status(httpCodes.unauthorized).jsend.fail({message: 'Failed to authenticate token'});
 *             return ;
 *         }
 *         req.decoded = decoded;
 *         next();
 *     });
 * });*/

module.exports = router;
