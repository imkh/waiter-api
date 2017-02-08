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

var askToken = function(done){
	    var data = {
		firstname: 'Ali',
		lastname: "Bomaye",
		email: 'ali.bomaye@gmail.com',
		password: 'tu_trouveras_jamais_mon_mdp_mouhahaha',
		type: 1
	    };

	    var user = new User({});

	    chai.request(app)
		.delete('/user/' + user.id)
		.send(user)
		.end(function(err, res){
		    expect(res).to.have.status(403);
		    expect(res.body).to.have.property('status')
		    	.and.to.equal('fail');
		    done();
		});
};

describe('User', function(){
    //Before each test we empty the database
    beforeEach(function (done){ 
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
	    var user = {
		firstname: 'Ali',
		lastname: "Bomaye",
		email: 'ali.bomaye@gmail.com',
		password: 'tu_trouveras_jamais_mon_mdp_mouhahaha',
		type: 1
	    };
	    
	    chai.request(app)
		.post('/user')
		.send(user)
		.end(function(err, res)  {
		    expect(res).to.have.status(201);
		    expect(res.body).to.have.property('status')
		    	.and.to.equal('success');
		    done();
		});
	});
    });

    describe('/DELETE user', function(){
	it('it should ask a token', askToken);
	
	it('it should DELETE a user', function(done){
	    var data = {
		firstname: 'Ali',
		lastname: "Bomaye",
		email: 'ali.bomaye@gmail.com',
		password: 'tu_trouveras_jamais_mon_mdp_mouhahaha',
		type: 1
	    };

	    var user = new User({});

	    chai.request(app)
		.delete('/user/' + user.id)
		.send(user)
		.end(function(err, res){
		    expect(res).to.have.status(403);
		    expect(res.body).to.have.property('status')
		    	.and.to.equal('fail');
		    done();
		});
	});
    });
});

