var mongoose = require('mongoose');
var userSchema = new mongoose.Schema({
    firstname: String,
    lastname: String,
    email: String,
    password: String,
    type: Number,
    tokens: [{
        hash: String,
        expirationDate: Date
    }]
});
mongoose.model('User', userSchema);