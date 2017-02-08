var mongoose = require('mongoose');
var userSchema = new mongoose.Schema({
    firstname: {type: String, required: true},
    lastname: {type: String, required: true},
    email: {
        type: String,
        unique: true,
        required: true,
        validate: {
            validator: function(email) {
                return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email);
            },
            message: '{VALUE} is not a valid email address'
        }
    },
    password: {type: String, required: true},
    type: Number,
    createdAt: {type: Date, default: Date.now},
    confirmToken: String,
    status: {type: String, enum: ['Not activated', 'Activated', 'Banned']}
});

module.exports = mongoose.model('User', userSchema);
