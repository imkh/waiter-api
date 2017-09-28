var mongoose = require('mongoose');

var eventSchema = new mongoose.Schema({
    name: {type: String, required: true},
    address: {type: String, required: true},
    location: {type: [Number], required: true}, // [Long, Lat]
    date: {type: String, required: true},
    img: {type: String},
    description: {type: String, required: true},
    listOfWaiters: {type: [mongoose.Schema.Types.ObjectId], ref: 'User'}
});

// Indexes this schema in 2dsphere format (critical for running proximity searches)
eventSchema.index({location: '2dsphere'});

module.exports = mongoose.model('Event', eventSchema);
