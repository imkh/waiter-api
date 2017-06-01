var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

var chaiHttp = require('chai-http');
var express = require('express');
var request = require('supertest');
var config = require('config');
var mongoose = require('mongoose');

var User = require('./../model/user');

var app = require('../app');

const serverConfig = config.get('server');

chai.use(chaiHttp);

var userId;
var userToken;
var userConfirmToken;
var userFirstName;
var userLastName;
var userEmail;
var userPassword;

describe('User', function(){
    //Before each test we empty the database

    before(function (done){
        mongoose.model('User').remove({}, function (err){
            done();
        });
    });

    /**
     * Test get all users
     */
    describe('/GET users', function(){
        it('it should GET all the users (empty)', function(done){
            chai.request(app)
                .get('/user')
                .end(function(err, res)  {
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('status').and.to.equal('success');
                    expect(res.body).to.have.property('data');
                    expect(res.body.data).to.have.property('users').and.to.deep.equal([]);
                    done();
                });
        });
    });

    /**
     * Test a successful user registration
     */
    describe('/POST user', function(){
        it('it should register the user `hello@world.com` and get an auth token', function(done){
            var data = {
                firstname: 'Hello',
                lastname: 'World',
                email: 'hello@world.com',
                password: 'helloworld',
                type: 0
            };

            userFirstName = data.firstname;
            userLastName = data.lastname;
            userEmail = data.email;
            userPassword = data.password;

            chai.request(app)
                .post('/user/register')
                .send(data)
                .end(function(err, res)  {
                    if (err) {
                        console.log(err);
                    }
                    expect(res).to.have.status(201);
                    expect(res.body).to.have.property('status').and.to.equal('success');
                    expect(res.body).to.have.property('data');
                    expect(res.body.data).to.have.property('token');
                    expect(res.body.data.user).to.have.property('_id');
                    userId = res.body.data.user._id;
                    userConfirmToken = res.body.data.user.confirmToken;
                    userToken = res.body.data.token;
                    done();
                });
        });
    });

    /**
     * Test failed user registrations
     */
    describe('/POST user', function(){
        var data = {
            firstname: '',
            lastname: '',
            email: '',
            password: '',
            type: 0
        };

        it('it should fail to register (password required)', function(done){
            chai.request(app)
                .post('/user/register')
                .send(data)
                .end(function(err, res)  {
                    expect(res).to.have.status(400);
                    expect(res.body).to.have.property('status').and.to.equal('fail');
                    expect(res.body).to.have.property('data');
                    expect(res.body.data).to.have.property('message').and.to.equal('User registration failed');
                    expect(res.body.data).to.have.property('causes');
                    expect(res.body.data.causes[0]).to.equal('A password is required');
                    done();
                });
        });

        it('it should fail to register (password should be 8 characters at least)', function(done){
            data.password = 'qwerty';
            chai.request(app)
                .post('/user/register')
                .send(data)
                .end(function(err, res)  {
                    expect(res).to.have.status(400);
                    expect(res.body).to.have.property('status').and.to.equal('fail');
                    expect(res.body).to.have.property('data');
                    expect(res.body.data).to.have.property('message').and.to.equal('User registration failed');
                    expect(res.body.data).to.have.property('causes');
                    expect(res.body.data.causes[0]).to.equal('A password must be at least 8 characters');
                    done();
                });
        });

        it('it should fail to register (first name, last name and email are required)', function(done){
            data.password = 'qwertyuiop';
            chai.request(app)
                .post('/user/register')
                .send(data)
                .end(function(err, res)  {
                    expect(res).to.have.status(400);
                    expect(res.body).to.have.property('status').and.to.equal('fail');
                    expect(res.body).to.have.property('data');
                    expect(res.body.data).to.have.property('message').and.to.equal('User registration failed');
                    expect(res.body.data).to.have.property('causes');
                    expect(res.body.data.causes[0]).to.equal('Path `firstname` is required.');
                    expect(res.body.data.causes[1]).to.equal('Path `lastname` is required.');
                    expect(res.body.data.causes[2]).to.equal('Path `email` is required.');
                    done();
                });
        });

        it('it should fail to register (email already used)', function(done){
            data.firstname = userFirstName;
            data.lastname = userLastName;
            data.email = userEmail;
            data.password = userPassword;
            chai.request(app)
                .post('/user/register')
                .send(data)
                .end(function(err, res)  {
                    expect(res).to.have.status(400);
                    expect(res.body).to.have.property('status').and.to.equal('fail');
                    expect(res.body).to.have.property('data');
                    expect(res.body.data).to.have.property('message').and.to.equal('User registration failed');
                    expect(res.body.data).to.have.property('causes');
                    expect(res.body.data.causes[0]).to.equal('This email address is already used');
                    done();
                });
        });

    });

    /**
     * Test get all users
     */
    describe('/GET users', function(){
        it('it should GET all the users (1 user: not activated)', function(done){
            chai.request(app)
                .get('/user')
                .end(function(err, res)  {
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('status').and.to.equal('success');
                    expect(res.body).to.have.property('data');
                    expect(res.body.data).to.have.property('users').and.to.have.length.of(1);
                    expect(res.body.data.users[0]).to.have.property('_id').and.to.equal(userId);
                    expect(res.body.data.users[0]).to.have.property('firstname').and.to.equal(userFirstName);
                    expect(res.body.data.users[0]).to.have.property('lastname').and.to.equal(userLastName);
                    expect(res.body.data.users[0]).to.have.property('email').and.to.equal(userEmail);
                    expect(res.body.data.users[0]).to.have.property('status').and.to.equal('not-activated');
                    done();
                });
        });
    });

    /**
     * Test activate user
     */
    describe('/GET users', function(){
        it('it should activate the user account `hello@world.com`', function(done){
            chai.request(app)
                .get('/user/confirm/' + userId + '/token/' + userConfirmToken)
                .end(function(err, res)  {
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('status').and.to.equal('success');
                    expect(res.body).to.have.property('data');
                    expect(res.body.data).to.have.property('user');
                    expect(res.body.data.user).to.have.property('_id').and.to.equal(userId);
                    done();
                });
        });
    });


    /**
     * Test get all users
     */
    describe('/GET users', function(){
        it('it should GET all the users (1 user: activated)', function(done){
            chai.request(app)
                .get('/user')
                .end(function(err, res)  {
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('status').and.to.equal('success');
                    expect(res.body).to.have.property('data');
                    expect(res.body.data).to.have.property('users').and.to.have.length.of(1);
                    expect(res.body.data.users[0]).to.have.property('_id').and.to.equal(userId);
                    expect(res.body.data.users[0]).to.have.property('firstname').and.to.equal(userFirstName);
                    expect(res.body.data.users[0]).to.have.property('lastname').and.to.equal(userLastName);
                    expect(res.body.data.users[0]).to.have.property('email').and.to.equal(userEmail);
                    expect(res.body.data.users[0]).to.have.property('status').and.to.equal('activated');
                    done();
                });
        });
    });

    /**
     * Test an available email address
     */
    describe('/AVAILABLE email', function(){
        it('email `email@available.com` should be available', function(done){
            chai.request(app)
                .get('/user/available/' + 'email@available.com')
                .end(function(err, res)  {
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('status').and.to.equal('success');
                    expect(res.body).to.have.property('data');
                    expect(res.body.data).to.have.property('message').and.to.equal('This email address is available');
                    done();
                });
        });
    });

    /**
     * Test an already used email address
     */
    describe('/AVAILABLE email', function(){
        it('email `' + userEmail + '` should be already used', function(done){
            chai.request(app)
                .get('/user/available/' + userEmail)
                .end(function(err, res)  {
                    expect(res).to.have.status(409);
                    expect(res.body).to.have.property('status').and.to.equal('fail');
                    expect(res.body).to.have.property('data');
                    expect(res.body.data).to.have.property('message').and.to.equal('This email address is already used');
                    done();
                });
        });
    });

    /**
     * Test a successful login
     */
    describe('/LOGIN user', function(){
        it('it should LOGIN the user `hello@world.com` and get an auth token', function(done){
            var data = {
                email: 'hello@world.com',
                password: 'helloworld'
            };

            chai.request(app)
                .post('/user/login')
                .send(data)
                .end(function(err, res){
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('status').and.to.equal('success');
                    expect(res.body).to.have.property('data');
                    expect(res.body.data).to.have.property('token');
                    expect(res.body.data.user).to.have.property('_id').and.to.equal(userId);
                    expect(res.body.data.user).to.have.property('firstname').and.to.equal(userFirstName);
                    expect(res.body.data.user).to.have.property('lastname').and.to.equal(userLastName);
                    userToken = res.body.data.token;
                    done();
                });
        });
    });

    /**
     * Test failed login
     */
    describe('/LOGIN user', function(){
        var data = {
            email: '',
            password: ''
        };

        it('it should fail to login (email and password required)', function(done){
            chai.request(app)
                .post('/user/login')
                .send(data)
                .end(function(err, res)  {
                    expect(res).to.have.status(400);
                    expect(res.body).to.have.property('status').and.to.equal('fail');
                    expect(res.body).to.have.property('data');
                    expect(res.body.data).to.have.property('message').and.to.equal('User login failed');
                    expect(res.body.data).to.have.property('causes');
                    expect(res.body.data.causes[0]).to.equal('An email address is required');
                    expect(res.body.data.causes[1]).to.equal('A password is required');
                    done();
                });
        });

        it('it should fail to login (user not found)', function(done){
            data.email = 'user@notfound.com';
            data.password = 'incorrect-password';
            chai.request(app)
                .post('/user/login')
                .send(data)
                .end(function(err, res)  {
                    expect(res).to.have.status(404);
                    expect(res.body).to.have.property('status').and.to.equal('fail');
                    expect(res.body).to.have.property('data');
                    expect(res.body.data).to.have.property('message').and.to.equal('User login failed');
                    expect(res.body.data).to.have.property('causes');
                    expect(res.body.data.causes[0]).to.equal('User not found');
                    done();
                });
        });

        it('it should fail to login (incorrect password)', function(done){
            data.email = userEmail;
            data.password = 'incorrect-password';
            chai.request(app)
                .post('/user/login')
                .send(data)
                .end(function(err, res)  {
                    expect(res).to.have.status(401);
                    expect(res.body).to.have.property('status').and.to.equal('fail');
                    expect(res.body).to.have.property('data');
                    expect(res.body.data).to.have.property('message').and.to.equal('User login failed');
                    expect(res.body.data).to.have.property('causes');
                    expect(res.body.data.causes[0]).to.equal('Incorrect password');
                    done();
                });
        });
    });

    /**
     * Test get one user by id
     */
    describe('/GET user by ID', function(){
        it('it should GET a user by its ID', function(done){
            chai.request(app)
                .get('/user/' + userId)
                .set('x-access-token', userToken)
                .end(function(err, res)  {
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('status').and.to.equal('success');
                    expect(res.body).to.have.property('data');
                    expect(res.body.data).to.have.property('user');
                    expect(res.body.data.user).to.have.property('_id').and.to.equal(userId);
                    expect(res.body.data.user).to.have.property('firstname').and.to.equal(userFirstName);
                    expect(res.body.data.user).to.have.property('lastname').and.to.equal(userLastName);
                    expect(res.body.data.user).to.have.property('email').and.to.equal(userEmail);
                    expect(res.body.data.user).to.have.property('status').and.to.equal('activated');
                    done();
                });
        });
    });

    /**
     * Test update password
     */
    describe('/PUT password', function(){
        this.timeout(5000);
        it('it should change a password with user ID', function(done){

            var data = {
                password: userPassword,
                newPassword: 'qwertyuiop'
            };

            chai.request(app)
                .put('/user/' + userId + "/password")
                .send(data)
                .set('x-access-token', userToken)
                .end(function(err, res)  {
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('status').and.to.equal('success');
                    expect(res.body).to.have.property('data');
                    expect(res.body.data).to.have.property('user');
                    expect(res.body.data.user).to.have.property('_id').and.to.equal(userId);
                    userPassword = data.newPassword;
                    done();
                });
        });
    });

    /**
     * Test update profile
     */
    describe('/PUT profile', function(){
        this.timeout(5000);
        it('it should change profile information', function(done){

            var data = {
                firstname: 'John',
                lastname: "Doe",
                email: 'john@doe.com',
                password: userPassword
            };

            chai.request(app)
                .put('/user/' + userId + "/profile")
                .send(data)
                .set('x-access-token', userToken)
                .end(function(err, res)  {
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('status').and.to.equal('success');
                    expect(res.body).to.have.property('data');
                    expect(res.body.data).to.have.property('user');
                    expect(res.body.data.user).to.have.property('_id').and.to.equal(userId);
                    userFirstName = data.firstname;
                    userLastName = data.lastname;
                    userEmail = data.email;
                    done();
                });
        });
    });

    /**
     * Test login with new IDs
     */
    describe('/LOGIN user', function(){
        it('it should LOGIN the user with its new IDs', function(done){
            var data = {
                email: userEmail,
                password: userPassword
            };

            chai.request(app)
                .post('/user/login')
                .send(data)
                .end(function(err, res){
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('status').and.to.equal('success');
                    expect(res.body).to.have.property('data');
                    expect(res.body.data).to.have.property('token');
                    expect(res.body.data.user).to.have.property('_id').and.to.equal(userId);
                    expect(res.body.data.user).to.have.property('firstname').and.to.equal(userFirstName);
                    expect(res.body.data.user).to.have.property('lastname').and.to.equal(userLastName);
                    userToken = res.body.data.token;
                    done();
                });
        });
    });

    /**
     * Test logout user
     */
    describe('/LOGOUT user', function(){
        it('it should LOGOUT the user', function(done){
            var data = {
                email: userEmail,
                password: userPassword
            };

            chai.request(app)
                .post('/user/login')
                .send(data)
                .end(function(err, res){
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('status').and.to.equal('success');
                    expect(res.body).to.have.property('data');
                    done();
                });
        });
    });


    /**
     * Test delete user
     */
    describe('/DELETE user', function(){
        it('it should DELETE a user', function(done){

            var data = {
                password: userPassword
            };

            chai.request(app)
                .delete('/user/' + userId + '/delete')
                .send(data)
                .set('x-access-token', userToken)
                .end(function(err, res){
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('status').and.to.equal('success');
                    expect(res.body).to.have.property('data');
                    done();
                });
        });
    });

    /**
     * Test delete already delete user
     */
    describe('/DELETE user', function(){
        it('it should return an error 404 (user already deleted)', function(done){
            chai.request(app)
                .delete('/user/' + userId + '/delete')
                .set('x-access-token', userToken)
                .end(function(err, res){
                    expect(res).to.have.status(404);
                    expect(res.body).to.have.property('status').and.to.equal('fail');
                    done();
                });
        });
    });
});
