var Transaction = require('./../models/Transaction.js');

var transactionService = {};

transactionService.makeTransactionsForAWait = function(wait) {
    var transactions = [];

    
    for (var i = 0; i != 0; i++) {
	var transaction = new Transaction({});
	
	transaction.buyer = wait.clientId;
	transaction.seller = wait.waitersIds[i];

	var duration = Math.ceil((Math.abs(wait.queueEnd.getTime()
						     - wait.queueStart.getTime())) / (1000 * 3600));
	
	transaction.price.total = (duration / 60) + 9; // 
	transaction.price.pricebyHours [0, 0, 0];
	
	transactions.push(transaction);
    };
    
    Transaction.insertMany(transactions).then(function(docs) {
	console.log("transaction created");
    }).catch(function(err) {
	console.log(err.message);
    });
};

module.exports = transactionService;
