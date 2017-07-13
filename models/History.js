/**
 * Created by quentinhuang on 23/02/2017.
 */
var mongoose = require('mongoose');

var personSchema = new mongoose.Schema({
    _id: Schema.Types.ObjectId,
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    email: {type: String }
});

var historySchema = new mongoose.Schema({
    event: {
	name: {type: String, required: true},
	address: {type: String, required: true},
	location: {type: [Number], required: true} // [Long, Lat]
    },
    client: personSchema,
    waiters: [personSchema],
    wait: {
	queueStart: {type: Date},
	queueEnd: {type: Date},
	queueDuration: { type: Number }, // in minute
	state: {type: String, enum: ['created', 'queue-start', 'queue-done', 'conflict', 'paid', 'resolved']}
    },
    price: {
	total: Number,
	pricebyHours: [Number]
    }
});

module.exports = mongoose.model('History', historySchema);
