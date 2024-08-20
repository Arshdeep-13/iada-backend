const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const imageSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        data: Buffer,
        contentType: String
    }
});

module.exports = mongoose.model('Image', imageSchema);
