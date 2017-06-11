var express = require('express');
var router = express.Router();
var bcrypt = require('bcryptjs');
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
var httpCodes = config.get('httpCodes');
var User = require('./../model/user');


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

/**
 * Create the confirmation token
 * @returns {string} the confirmation token
 */
function makeid()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for(var i = 0; i < 20; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

// Start: Unprotected routes
/**
 * Route check available email
 */
router.get('/available/:email', function(req, res) {
    User.findOne({email: req.params.email}, function (err, foundUser) {
        if (err) {
            res.status(httpCodes.internalServerError).jsend.error({message: err.message});
            return ;
        }
        if (foundUser !== null) {
            res.status(httpCodes.conflict).jsend.fail({message: 'This email address is already used'});
            return ;
        }
        res.jsend.success({message: 'This email address is available'});
    })
});

/**
 * Route Register/Signup/Sign up
 */
router.post('/register', function(req, res) {
    var salt = bcrypt.genSaltSync(saltRounds);
    var causes = [];

    if (!res.req.body.deviceId) {
        causes.push('A device is required');
        res.status(httpCodes.badRequest).jsend.fail({message: 'User registration failed', causes: causes});
        return;
    }

    if (!res.req.body.password) {
        causes.push('A password is required');
        res.status(httpCodes.badRequest).jsend.fail({message: 'User registration failed', causes: causes});
        return ;
    } else if (res.req.body.password.length < 8) {
        causes.push('A password must be at least 8 characters');
        res.status(httpCodes.badRequest).jsend.fail({message: 'User registration failed', causes: causes});
        return ;
    }

    var user = {
        firstName: res.req.body.firstName,
        lastName: res.req.body.lastName,
        email: res.req.body.email,
        password: bcrypt.hashSync(res.req.body.password, salt),
        type: res.req.body.type,
        status: 'not-activated',
        confirmToken: makeid()
    };

    User.create(user, function(err, createdUser) {
        if (err) {
            if (err.errors) {
                if (err.errors.firstName)
                    causes.push(err.errors.firstName.message);
                if (err.errors.lastName)
                    causes.push(err.errors.lastName.message);
                if (err.errors.email)
                    causes.push(err.errors.email.message);
                if (err.errors.password)
                    causes.push(err.errors.password.message);
                if (err.errors.type)
                    causes.push(err.errors.type.message);
                if (err.errors.status)
                    causes.push(err.errors.status.message);
                if (err.errors.confirmToken)
                    causes.push(err.errors.confirmToken.message);
                if (err.errors.devices)
                    causes.push(err.errors.devices.message);
            }
            res.status(httpCodes.badRequest).jsend.fail({message: 'User registration failed', causes: causes});
            return ;
        }

        //TODO::fix mail sending
        // emailConfig.text = 'http://127.0.0.1:5000/user/confirm/' + createdUser._id.toString() + '/' + createdUser.confirmToken;
        // transporter.sendMail(emailConfig, function (err) {
        //     if (err) {
        //         console.error('Emailing error: ' + err);
        //         return ;
        //     }
        //     console.log('Email sent at ' + emailConfig.to);
        // });

        var token = jwt.sign(createdUser._id, tokenSecret, {
            expiresIn: "31d" // expires in 30days hours
        });
        var response = {
            token: token,
            user: {
                _id: createdUser._id.toString(),
                confirmToken: createdUser.confirmToken
            }
        };
        if (!createdUser.devices.includes(res.req.body.deviceId)) {
            createdUser.devices.push(res.req.body.deviceId);
            createdUser.save(function (err) {
                if (err) {
                    res.status(httpCodes.badRequest).jsend.error({message: err.message});
                    return ;
                }
                res.status(httpCodes.created).jsend.success(response);
            });
        } else {
            res.status(httpCodes.created).jsend.success(response);
        }
    });
});

/**
 * Route Activate/Confirm User
 */
router.get('/confirm/:id/token/:confirmToken', function(req, res) {
    var causes = [];

    User.findById(req.params.id, function (err, user) {
        if (err) {
            res.status(httpCodes.internalServerError).jsend.error({message: err.message});
            return ;
        }
        if (user === null) {
            causes.push('User not found');
            res.status(httpCodes.notFound).jsend.fail({message: 'Confirmation failed', causes: causes});
            return ;
        }
        if (req.params.confirmToken !== user.confirmToken) {
            causes.push('Invalid confirmation token');
            res.status(httpCodes.unauthorized).jsend.fail({message: 'Confirmation failed', causes: causes});
            return ;
        }
        if (user.status !== 'not-activated') {
            causes.push('User already activated');
            res.status(httpCodes.conflict).jsend.fail({message: 'Confirmation failed', causes: causes});
            return ;
        }

        user.update({status: 'activated'}, function (err) {
            if (err) {
                res.status(httpCodes.internalServerError).jsend.error({message: err.message});
                return ;
            }
            var response = {
                user: {
                    _id: user._id.toString()
                }
            };

            res.jsend.success(response);
        });
    });
});

/**
 * Route Login/Signin/Sign in
 */
router.post('/login', function(req, res) {
    var causes = [];

    if (!res.req.body.email)
        causes.push('An email address is required');
    if (!res.req.body.password)
        causes.push('A password is required');
    if (causes.length > 0) {
        res.status(httpCodes.badRequest).jsend.fail({message: 'User login failed', causes: causes});
        return ;
    }

    if (!res.req.body.deviceId) {
        causes.push('A device is required');
        res.status(httpCodes.badRequest).jsend.fail({message: 'User login failed', causes: causes});
        return;
    }

    User.findOne({email: res.req.body.email}, function (err, user) {
        if (err) {
            res.status(httpCodes.internalServerError).jsend.error({message: err.message});
            return ;
        }
        if (user === null) {
            causes.push('User not found');
            res.status(httpCodes.notFound).jsend.fail({message: 'User login failed', causes: causes});
            return ;
        }
        if (!bcrypt.compareSync(res.req.body.password, user.password)) {
            causes.push('Incorrect password');
            res.status(httpCodes.unauthorized).jsend.fail({message: 'User login failed', causes: causes});
            return ;
        }

        var token = jwt.sign(user._id, tokenSecret, {
            expiresIn: "31d" // expires in 30days hours
        });
        var response = {
            token: token,
            user: {
                _id: user._id.toString(),
                firstName: user.firstName,
                lastName: user.lastName
            }
        };
        if (!user.devices.includes(res.req.body.deviceId)) {
            user.devices.push(res.req.body.deviceId);
            user.save(function (err) {
                if (err) {
                    res.status(httpCodes.badRequest).jsend.error({message: err.message});
                    return ;
                }
                res.jsend.success(response);
            });
        } else {
            res.jsend.success(response);
        }
    });
});

/**
 * Route Logout/Log out
 */
router.put('/:id/logout', function(req, res) {
    var causes = [];

    User.findById(req.params.id, function (err, user) {
        if (err) {
            res.status(httpCodes.internalServerError).jsend.error({message: err.message});
            return ;
        }
        if (user === null) {
            causes.push('User not found');
            res.status(httpCodes.notFound).jsend.fail({message: 'Logout failed', causes: causes});
            return ;
        }

        user.update({token: ""}, {runValidators: true},
            function (err) {
                if (err) {
                    res.status(httpCodes.internalServerError).jsend.error({message: err.message});
                    return ;
                }
                res.jsend.success({message: 'User successfully logged out'});
            });
    });
});


/**
 * Route Get All Users
 */
router.get('/', function(req, res) {
    User.find({}, function (err, users) {
        if (err) {
            res.status(httpCodes.internalServerError).jsend.error({message: err.message});
            return ;
        }
        res.jsend.success({users: users});
    }).select('-password -__v');
});
// End: Unprotected routes


// Start: Middleware
/**
 * Middleware verify user if
 */
router.param('id', function(req, res, next, id) {
    var causes = [];

    User.findById(id, function (err, user) {
        if (err) {
            res.status(httpCodes.internalServerError).jsend.error({message: err.message});
            return ;
        }
        if (user === null) {
            causes.push('User not found');
            res.status(httpCodes.notFound).jsend.fail({message: 'User middleware failed', causes: causes});
            return ;
        }
        next();

        // if (err) {
        //     console.log(id + ' was not found');
        //     res.status(404);
        //     var err = new Error('Not Found');
        //     err.status = 404;
        //     res.format({
        //         json: function(){
        //             res.status(404).json({status: "fail", data : { message: err.status  + ' ' + err}});
        //         }
        //     });
        // } else {
        //     req.id = id;
        //     next();
        // }
    });
});

/**
 * Middleware verify token
 */
router.use(function(req, res, next) {
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    if (!token) {
        res.status(httpCodes.badRequest).jsend.fail({message: 'No token provided.'});
        return ;
    }
    jwt.verify(token, tokenSecret, function(err, decoded) {
        if (err) {
            res.status(httpCodes.unauthorized).jsend.fail({message: 'Failed to authenticate token'});
            return ;
        }
        req.decoded = decoded;
        next();
    });
});
// End: Middleware


// Start: Protected routes by token system
/**
 * Route Get One User By ID
 */
router.get('/:id', function(req, res) {
    var causes = [];

    User.findById(req.params.id, function (err, user) {
        if (err) {
            res.status(httpCodes.internalServerError).jsend.error({message: err.message});
            return ;
        }
        if (user === null) {
            causes.push('User not found');
            res.status(httpCodes.notFound).jsend.fail({message: 'Get user failed', causes: causes});
            return ;
        }

        res.jsend.success({user: user});
    }).select('-password -__v');
});

/**
 * Route Update Password
 */
router.put('/:id/password', function(req, res) {
    var causes = [];

    if (!res.req.body.newPassword) {
        causes.push('A new password is required');
        res.status(httpCodes.badRequest).jsend.fail({message: 'Update password failed', causes: causes});
        return ;
    }

    var salt = bcrypt.genSaltSync(saltRounds);
    var newPassword = bcrypt.hashSync(res.req.body.newPassword, salt);

    User.findById(req.params.id, function (err, user) {
        if (err) {
            res.status(httpCodes.badRequest).jsend.error({message: err.message});
            return ;
        }
        if (user === null) {
            causes.push('User not found');
            res.status(httpCodes.notFound).jsend.fail({message: 'Update password failed', causes: causes});
            return ;
        }

        var password = res.req.body.password;
        if (!password || !bcrypt.compareSync(password, user.password)) {
            causes.push('Incorrect password');
            res.status(httpCodes.unauthorized).jsend.fail({message: 'Update password failed', causes: causes});
            return ;
        }

        user.update({
            password: newPassword,
            updatedAt: Date.now()
        }, function (err) {
            if (err) {
                res.status(httpCodes.badRequest).jsend.error({message: err.message});
                return ;
            }

            var response = {
                user: {
                    _id: user._id.toString()
                }
            };

            res.jsend.success(response);
        });
    });
});

/**
 * Route Update Profile
 */
router.put('/:id/profile', function(req, res) {
    var causes = [];

    var userChange = {};
    if (res.req.body.firstName) {
        userChange.firstName = res.req.body.firstName;
    }
    if (res.req.body.lastName) {
        userChange.lastName = res.req.body.lastName;
    }
    if (res.req.body.email) {
        userChange.email = res.req.body.email;
    }

    User.findById(req.params.id, function (err, user) {
        if (err) {
            res.status(httpCodes.internalServerError).jsend.error({message: err.message});
            return ;
        }
        if (user === null) {
            causes.push('User not found');
            res.status(httpCodes.notFound).jsend.fail({message: 'Update profile failed', causes: causes});
            return ;
        }

        userChange.updatedAt = Date.now();
        user.update(userChange, {runValidators: true},
            function (err) {
                if (err) {
                    if (err.errors) {
                        if (err.errors.lastName)
                            causes.push(err.errors.lastName.message);
                        if (err.errors.firstName)
                            causes.push(err.errors.firstName.message);
                        if (err.errors.email)
                            causes.push(err.errors.email.message);
                    } else {
                        causes.push(err.message);
                    }
                    res.status(httpCodes.badRequest).jsend.fail({message: 'Update profile failed', causes: causes});
                    return ;
                }

                var response = {
                    user: {
                        _id: user._id.toString()
                    }
                };

                res.jsend.success(response);
            });
    });
});

/**
 * Route Delete User By ID
 */
router.delete('/:id/delete', function(req, res) {
    var causes = [];

    User.findById(req.params.id, function (err, user) {
        if (err) {
            res.status(httpCodes.internalServerError).jsend.error({message: err.message});
            return ;
        }
        if (user === null) {
            causes.push('User not found');
            res.status(httpCodes.notFound).jsend.fail({message: 'Delete user failed', causes: causes});
            return ;
        }
        var password = res.req.body.password;
        if (!password || !bcrypt.compareSync(password, user.password)) {
            causes.push('Incorrect password');
            res.status(httpCodes.unauthorized).jsend.fail({message: 'Delete user failed', causes: causes});
            return ;
        }

        user.remove(function (err) {
            if (err) {
                res.status(httpCodes.badRequest).jsend.error({message: err.message});
                return ;
            }

            var response = {message: 'User successfully deleted'};
            res.jsend.success(response);
        });
    });
});
// End: Protected routes by token system

module.exports = router;
