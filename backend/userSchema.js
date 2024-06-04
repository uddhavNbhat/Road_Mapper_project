const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username : {
        type : String,
        require : true,
        unique : true,
    },
    password : {
        type : String,
        min : 6,
    }
},{timestamps : true});

module.exports = mongoose.model("userSchema",UserSchema);