const mongoose = require('mongoose');
const Schema =mongoose.Schema;

const userSchema = new Schema({
    userId:{type: Number  },
    name:{ type : String},
    assignedAstrologer : { type : mongoose.Schema.Types.ObjectId, ref: 'Astrologer'}
});

module.exports = mongoose.model('User', userSchema);