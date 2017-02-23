var mongoose = require('mongoose');
var eventSchema = new mongoose.Schema({
    name: {type: String, required: true},
    address: {type: String, required: true},
    lat: {type: Number, required: true},
    long: {type: Number, required: true},
    date: {type: String, required: true},
    img: {type: String},
    description: {type: String, required: true},
    listOfWaiters: {type: [mongoose.Schema.Types.ObjectId], ref: 'User'}
});

module.exports = mongoose.model('Event', eventSchema);
