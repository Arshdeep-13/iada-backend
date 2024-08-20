const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const zoneSchema = new Schema({
    zone_name:{
        type: String,
        required: true
    },
    zone_id:{
        type: String,
        unique: true,
        required: true
    },
    zone_area: {
        type: Number,
        required: true
    },
    no_Industries_under: {
        type: Number,
        required: true
    },
    zonal_admin_id: {
        type : String,
        required: true
    }
});

module.exports = mongoose.model('Zone', zoneSchema);
