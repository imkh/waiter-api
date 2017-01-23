var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var methodOverride = require('method-override');

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

router.get('/', function(req, res) {
    res.status(200).json({success: true});
});

router.get('/:id', function(req, res) {
    res.status(200).json({success: true});
});

router.post('/', function(req, res) {
    var firstname = res.req.body.firstname;
    var lastname = res.req.body.lastname;
    var email = res.req.body.email;
    var password = res.req.body.password;
    var type = res.req.body.type;

    mongoose.model('User').create({
        firstname: firstname,
        lastname: lastname,
        email: email,
        password: password,
        type: type
    }, function(err, user) {
        if (err) {
            res.status(500).json({success: false, message: 'fail user registration'});
        } else {
            res.status(200).json({success: true, message: user});
        }
    });
});

router.post('/login', function(req, res) {
    // var email;
    // var password;

    res.status(200).json({success: true});
});

router.put('/:id', function(req, res) {
    res.status(200).json({success: true});
});

router.delete('/:id', function(req, res) {
    res.status(200).json({success: true});
});

module.exports = router;