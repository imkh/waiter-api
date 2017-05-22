var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var methodOverride = require('method-override');
var jwt = require('jsonwebtoken');
var config = require('config');
var nodemailer = require('nodemailer');
var jsend = require('jsend');

var bcryptConfig = config.get('bcrypt');
var tokenConfig = config.get('JWT');
var emailConfig = config.get('email');
var smtpConfig = config.get('smtp');

var transporter = nodemailer.createTransport(smtpConfig);

const saltRounds = bcryptConfig.saltRounds;
const tokenSecret = tokenConfig.tokenSecret;



//@TODO ACL management

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

function makeid()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for(var i = 0; i < 20; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

//unprotected routes
router.post('/', function(req, res) {
    var salt = bcrypt.genSaltSync(saltRounds);
    var causes = [];

    if (!res.req.body.password) {
        causes.push('Path `Password` is required.')
	res.status(400).jsend.fail({message: 'fail user registration', causes: causes});
        return ;
    }

    var user = {
    	firstname: res.req.body.firstname,
	lastname: res.req.body.lastname,
	email: res.req.body.email,
	password: bcrypt.hashSync(res.req.body.password, salt),
	type: res.req.body.type,
	status: 'Not activated',
	confirmToken: makeid()
    };

    mongoose.model('User').create(user, function(err, createdUser) {
        if (err) {
            if (err.errors) {
                if (err.errors.lastname)
                    causes.push(err.errors.lastname.message)
                if (err.errors.firstname)
                    causes.push(err.errors.firstname.message)
                if (err.errors.email)
                    causes.push(err.errors.email.message)
                if (err.errors.password)
                    causes.push(err.errors.password.message)
            }
	    res.status(400).jsend.fail({message: 'fail user registration', causes: causes});
	    return ;
        }

        emailConfig.text = 'http://127.0.0.1:5000/user/confirm/' + createdUser._id.toString() +
	    '/' + createdUser.confirmToken;
        transporter.sendMail(emailConfig, function (err) {
            if (err) {
                console.error('Emailing error: ' + err);
		return ;
            }
            console.log('Email sent at ' + emailConfig.to);
        });

	var response = {
	    user: {
		id: createdUser._id.toString()
	    }
	};
        res.status(201).jsend.success(response);
    });
});

router.get('/confirm/:id/:confirmToken', function(req, res) {
    mongoose.model('User').findById(req.id, function (err, user) {
        if (err) {
            res.status(500).json({status: "fail"});
	    return ;
        }
        if (user === null) {
            res.status(404).json({status: "fail", data: 'user not found'});
	    return ;
        }
        if (req.params.confirmToken != user.confirmToken) {
	    res.status(404).json({status: "fail", data: 'invalid confirmation token'});
	    return ;
	}
        if (user.status !== 'Not activated') {
            res.json({status: "success", data: {user: user._id.toString(), message: 'User already activated'}});
	    return ;
	}

        user.update({status: 'Activated'}, function (err) {
            if (err) {
                res.status(500).json({status: "fail", data: {message: 'internal error'}});
		return ;
            }
            res.json({status: "success", data: {user: user._id.toString(), message: 'User activated'}});
        });
    });
});

router.post('/login', function(req, res) {
    var email = res.req.body.email;

    mongoose.model('User').findOne({email: email}, function (err, user) {
        if (err) {
            res.status(500).json({status: "fail"});
	    return ;
        }
        if (user === null) {
            res.status(500).json({status: "fail"});
	    return ;
        }

	if (res.req.body.password && bcrypt.compareSync(res.req.body.password, user.password)) {
            var token = jwt.sign(user._id, tokenSecret, {
                expiresIn: "31d" // expires in 30days hours
            });

            res.json({status: "success", data: {token: token, userId: user._id.toString(), firstName: user.firstname}});

        } else {
            res.status(500).json({status: "fail"});
        }

    });
});

router.put('/:id/logout', function(req, res) {
    mongoose.model('User').findById(req.id, function (err, user) {
        if (err) {
            res.status(500).json({status: "fail", data: {message: 'unknown user'}});
	    return ;
        }
        if (user === null) {
            res.status(404).json({status: "fail", data: 'user not found'});
	    return ;
        }

        user.update({token: ""}, {runValidators: true},
	function (err) {
	    if (err) {
		if (err.errors.lastname)
		    causes.push(err.errors.lastname.message);
		if (err.errors.firstname)
		    causes.push(err.errors.firstname.message);
		if (err.errors.email)
		    causes.push(err.errors.email.message);
		res.status(500).json({status: "fail", data: {message: 'Internal error', causes: causes}});
		return ;
	    }
	    res.status(200).jsend.success({});
	});
    });
});

router.get('/', function(req, res) {
    mongoose.model('User').find({}, function (err, users) {
        if (err) {
	    res.status(500).jsend.error({message: err});
	    return ;
        }
	res.status(200).jsend.success(users);
    });
});

//middelware start
router.param('id', function(req, res, next, id) {
    mongoose.model('User').findById(id, function (err, user) {
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
//middelware end


//protected routes by token system

router.get('/:id', function(req, res) {
    mongoose.model('User').findById(req.id, function (err, user) {
        if (err) {
            res.status(500).json({status: "fail"});
	    return ;
        }
        if (user === null) {
            res.status(404).json({status: "fail", data: 'user not found'});
	    return ;
        }
        res.json({status: "success", data: user});
    });
});

router.put('/:id/password', function(req, res) {

    if (!res.req.body.newPassword) {
        res.status(500).json({status: "fail", data: {message: 'Missing new password'}});
        return ;
    }

    var salt = bcrypt.genSaltSync(saltRounds);
    var newPassword = bcrypt.hashSync(res.req.body.newPassword, salt);

    mongoose.model('User').findById(req.id, function (err, user) {
        if (err) {
            res.status(500).json({status: "fail", data: {message: 'unknown user'}});
	    return ;
        }
        if (user === null) {
            res.status(404).json({status: "fail", data: 'user not found'});
	    return ;
        }

        if (res.req.body.password && bcrypt.compareSync(res.req.body.password, user.password)) {
            user.update({
                password: newPassword
            }, function (err) {
                if (err) {
                    res.status(500).json({status: "fail", data: {message: 'Internal error'}});
                } else {
                    res.json({status: "success", data: user._id.toString()});
                }
            });
        } else {
            res.status(500).json({status: "fail", data: {message: 'wrong password'}});
        }
    });
});

router.put('/:id/profile', function(req, res) {
    var causes = [];

    var userChange = {
	firstname: res.req.body.firstname,
	lastname: res.req.body.lastname,
	email: res.req.body.email
    };

    mongoose.model('User').findById(req.id, function (err, user) {
        if (err) {
            res.status(500).json({status: "fail", data: {message: 'unknown user'}});
	    return ;
        }
        if (user === null) {
            res.status(404).json({status: "fail", data: {message: 'user not found'}});
	    return ;
        }

        user.update(userChange, {runValidators: true},
	function (err) {
	    if (err) {
		if (err.errors.lastname)
		    causes.push(err.errors.lastname.message);
		if (err.errors.firstname)
		    causes.push(err.errors.firstname.message);
		if (err.errors.email)
		    causes.push(err.errors.email.message);
		res.status(500).json({status: "fail", data: {message: 'Internal error', causes: causes}});
		return ;
	    }
	    res.status(200).jsend.success();
	});
    });
});

router.delete('/:id', function(req, res) {
    mongoose.model('User').findById(req.id, function (err, user) {
        if (err) {
            res.status(500).json({status: "fail", data: {message: 'unknown user'}});
	    return ;
        }
	if (user === null) {
            res.status(404).json({status: "fail", data: {message: 'user not found'}});
	    return ;
        }

        user.remove(function (err) {
            if (err) {
                res.status(500).json({status: "fail", data: {message: 'Internal error'}});
		return ;
            }
	    res.status(200).jsend.success();
        });
    });
});

module.exports = router;
