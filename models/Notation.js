var mongoose = require('mongoose');

var notationSchema = new mongoose.Schema({
  clientId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  waiterId: {type: [mongoose.Schema.Types.ObjectId], ref: 'User'},
  waitId: {type: [mongoose.Schema.Types.ObjectId], ref: 'Wait'},
  date: {type: Date, default: Date.now},
  notation: {type: Number, min: 0, max: 5, required: true},
  comment: {type: String}
});

module.exports = mongoose.model('Notation', notationSchema);
