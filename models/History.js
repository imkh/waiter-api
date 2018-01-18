/**
 * Created by quentinhuang on 23/02/2017.
 */
var mongoose = require('mongoose');

var Schema = mongoose.Schema,
    UserId = Schema.ObjectId;

var personSchema = new mongoose.Schema({
    _id: UserId,
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
    },
  notation: {
    date: {
      type: Date, default: Date.now
    },
    notation: {type: Number, min: 0, max: 5, default: 0},
    comment: {type: String}
  }
});


module.exports = mongoose.model('History', historySchema);
