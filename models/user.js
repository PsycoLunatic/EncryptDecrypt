const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    faceid: {
        type: String,
        unique: true,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
