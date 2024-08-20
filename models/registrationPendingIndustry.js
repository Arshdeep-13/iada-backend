const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const industrySchema = new Schema({
    user_id:{
        type: String,
        requried:true,
        unique:true
    },
    user_name:{
        type: String,
        required : true,
    },
    user_email:{
        type: String,
        required : true,
        unique : true,
    },
    user_dob:{
        type: Date,
        requried: true
    },
    phone_number:{
        type: String,
        required: true
    },
    industry_id:{
        type: schema.Types.ObjectId,
        ref: "Industry",
        required:true
    }
});

module.exports = mongoose.model('Industry',industrySchema);