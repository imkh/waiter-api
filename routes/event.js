/**
 * Created by quentinhuang on 03/02/2017.
 */
var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var methodOverride = require('method-override');
var config = require('config');

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
                res.status(404).json({status: "fail", data: {message: 'user not found'}});
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

module.exports = router;
