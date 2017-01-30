var mongoose = require('mongoose');
var userSchema = new mongoose.Schema({
    firstname: String,
    lastname: String,
    email: String,
    password: String,
    type: Number,
    createdAt: {type: Date, default: Date.now},
    confirmToken: String
});
mongoose.model('User', userSchema);