/**
 * Created by quentinhuang on 23/02/2017.
 */
var mongoose = require('mongoose');
var waitSchema = new mongoose.Schema({
    clientId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    waitersIds: {type: [mongoose.Schema.Types.ObjectId], ref: 'User'},
    eventId: {type: mongoose.Schema.Types.ObjectId, ref: 'Event'},
    eventName: {type: String, required: true},
    eventLocation: {type: [Number], required: true}, // [Long, Lat]
    state: {type: String, enum: ['created', 'queue-start', 'queue-done', 'conflict', 'paid']},
    nresponses: {type: [mongoose.Schema.Types.ObjectId], ref: 'User'},
    createdAt: {type: Date, default: Date.now},
    updatedAt: {type: Date},
    queueStart: {type: Date},
    queueEnd: {type: Date},
    confirmationCode: {type: String}
});

module.exports = mongoose.model('Wait', waitSchema);
