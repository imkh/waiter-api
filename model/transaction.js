var mongoose = require('mongoose');

var transactionSchema = new mongoose.Schema({
    buyer: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    seller: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    price: {
	total: Number,
	pricebyHours: [Number]
    }
});

module.exports = mongoose.model('Transaction', transactionSchema);
