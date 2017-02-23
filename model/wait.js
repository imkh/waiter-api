/**
 * Created by quentinhuang on 23/02/2017.
 */
var mongoose = require('mongoose');
var waitSchema = new mongoose.Schema({
    clientId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    waitersIds: {type: [mongoose.Schema.Types.ObjectId], ref: 'User'},
    state: {type: String, enum: ['not confirmed', 'rejected', 'accepted', 'queuing', 'queue done', 'conflict', 'payed']},
    createdAt: {type: Date, default: Date.now},
    updatedAt: {type: Date},
    confirmationCode: {type: String}
});

module.exports = mongoose.model('Wait', waitSchema);
