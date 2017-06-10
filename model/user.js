var mongoose = require('mongoose');
var beautifyUnique = require('mongoose-beautiful-unique-validation');

var userSchema = new mongoose.Schema({
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    email: {
        type: String,
        unique: 'This email address is already used',
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
    updatedAt: {type: Date, default: Date.now},
    confirmToken: String,
    waiterCurrentEvent: {type: String, default: null},
    status: {type: String, enum: ['not-activated', 'activated', 'banned']},
    currentEvent: {type: mongoose.Schema.Types.ObjectId, ref: 'Event'},
    devices: {
        ios: [],
        android: [],
        web: []
    }
});

userSchema.plugin(beautifyUnique);

// var handleE11000 = function(error, res, next) {
//     console.log( JSON.stringify(error.errmsg) );
//     if (error.name === 'MongoError' && error.code === 11000) {
//         next(new Error('There was a duplicate key error'));
//     } else {
//         next();
//     }
// };
// userSchema.post('save', handleE11000);
// userSchema.post('update', handleE11000);
// userSchema.post('findOneAndUpdate', handleE11000);
// userSchema.post('insertMany', handleE11000);

module.exports = mongoose.model('User', userSchema);
