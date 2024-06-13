const mongoose = require('mongoose');
const Schema =mongoose.Schema;

const astrologerSchema = new Schema({   
    astroId:{type : Number , required: true},
    name:{ type : String, required : true},
    available:{type: Boolean, default: true },
    connections : {type : Number, default : 0},
    top : {type : Boolean, default : false},
    weight: { type: Number, default: 1 }
});

module.exports = mongoose.model('Astrologer', astrologerSchema);