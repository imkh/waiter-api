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

describe('User', function(){
    //Before each test we empty the database

    before(function (done){
        mongoose.model('User').remove({}, function (err){
            done();
        });
    });


    describe('/GET users', function(){
        it('it should GET all the users', function(done){
            chai.request(app)
                .get('/user')
                .end(function(err, res)  {
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('status')
                        .and.to.equal('success');
                    expect(res.body).to.have.property('data')
                        .and.to.deep.equal([]);
                    done();
                });
        });
    });

    describe('/POST user', function(){
        it('it should /POST a user', function(done){
            var data = {
                firstname: 'Eli',
                lastname: "vomaye",
                email: 'bomaye@gmail.com',
                password: 'zazaza',
                type: 0
            };

            chai.request(app)
                .post('/user')
                .send(data)
                .end(function(err, res)  {
                    expect(res).to.have.status(201);
                    expect(res.body).to.have.property('status')
                        .and.to.equal('success');
                    done();
                });
        });
    });

    describe('/LOGIN user', function(){
        it('it should LOGIN a user and get a token', function(done){
            var data = {
                email: 'bomaye@gmail.com',
                password: 'zazaza'
            };


            chai.request(app)
                .post('/user/login')
                .send(data)
                .end(function(err, res){
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('status')
                        .and.to.equal('success');
                    userToken = res.body.data.token;
                    userId = res.body.data.user;
                    done();
                });
        });
    });

    describe('/GET user by ID', function(){
        it('it should GET user by its ID', function(done){
            chai.request(app)
                .get('/user/' + userId)
                .set('x-access-token', userToken)
                .end(function(err, res)  {
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('status')
                        .and.to.equal('success');
                    done();
                });
        });
    });

    describe('/PUT password', function(){
        this.timeout(5000);
        it('it should change a password with user ID', function(done){

            var data = {
                password:'zazaza',
                newPassword: 'bobobo'
            };

            chai.request(app)
                .put('/user/' + userId + "/password")
                .send(data)
                .set('x-access-token', userToken)
                .end(function(err, res)  {
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('status')
                        .and.to.equal('success');
                    done();
                });
        });
    });

    describe('/PUT profile', function(){
        this.timeout(5000);
        it('it should change profile informations', function(done){

            var data = {
                firstname: 'Ali',
                lastname: "Bomaye",
                email: 'ali.bomaye@gmail.com'
            };

            chai.request(app)
                .put('/user/' + userId + "/profile")
                .send(data)
                .set('x-access-token', userToken)
                .end(function(err, res)  {
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('status')
                        .and.to.equal('success');
                    done();
                });
        });
    });

    describe('/DELETE user', function(){
        it('it should DELETE a user', function(done){
            chai.request(app)
                .delete('/user/' + userId)
                .set('x-access-token', userToken)
                .end(function(err, res){
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('status')
                        .and.to.equal('success');
                    done();
                });
        });
    });

    describe('/GET fake route', function(){
        it('it should return an error 404', function(done){
            chai.request(app)
                .delete('/user/' + userId)
                .set('x-access-token', userToken)
                .end(function(err, res){
                    expect(res).to.have.status(404);
                    expect(res.body).to.have.property('status')
                        .and.to.equal('fail');
                    done();
                });
        });
    });
});

