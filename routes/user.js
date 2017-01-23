var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var methodOverride = require('method-override');
const saltRounds = 14;

//@TODO token management
//@TODO ACL management

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
    mongoose.model('User').findById(id, function (err, user) {
        if (err) {
            console.log(id + ' was not found');
            res.status(404)
            var err = new Error('Not Found');
            err.status = 404;
            res.format({
                json: function(){
                    res.status(404).json({success: false, message : err.status  + ' ' + err});
                }
            });
        } else {
            req.id = id;
            next();
        }
    });
});

router.get('/', function(req, res) {
    mongoose.model('User').find({}, function (err, users) {
        if (err) {
            res.status(500).json({success: false});
        } else {
            res.json({success: true, message: users});
        }
    });
});

router.get('/:id', function(req, res) {
    mongoose.model('User').findById(req.id, function (err, user) {
        if (err) {
            res.status(500).json({success: false});
        } else {
            res.json({success: true, message: user});
        }
    });
});

router.post('/', function(req, res) {
    var salt = bcrypt.genSaltSync(saltRounds);
    var firstname = res.req.body.firstname;
    var lastname = res.req.body.lastname;
    var email = res.req.body.email;
    var password = bcrypt.hashSync(res.req.body.password, salt);;
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
    var email = res.req.body.email;

    mongoose.model('User').findOne({email: email}, function (err, user) {
        if (err) {
            res.status(500).json({success: false});
        } else {
            if (bcrypt.compareSync(res.req.body.password, user.password)) {
                //@TODO token management
                res.json({success: true, message: user});
            } else {
                res.status(500).json({success: false});
            }
        }
    });
});

router.put('/:id/password', function(req, res) {
    res.status(200).json({success: true});
});

router.put('/:id/profile', function(req, res) {
    res.status(200).json({success: true});
});


router.delete('/:id', function(req, res) {
    res.status(200).json({success: true});
});

module.exports = router;