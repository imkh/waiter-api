/**
 * Created by quentinhuang on 23/01/2017.
 */
var mongoose = require('mongoose');
var config = require('config');

const mongoConfig = config.get('mongo');
mongoose.connect(mongoConfig.URL);