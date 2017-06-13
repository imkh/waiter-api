var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var methodOverride = require('method-override');
var config = require('config');
var jsend = require('jsend');

var httpCodes = config.get('httpCodes');


router.use(jsend.middleware);
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({
    extended: true
}));

router.post('/create', function(req, res) {
    var causes = [];

    console.log(req.body);
    res.status(httpCodes.created).jsend.success(req.body);
});

module.exports = router;
