const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const alertSchema = new Schema({
    zone_id: {
        type: String,
        required: true
    },
    alerts: [{
        alert_id: {
            type: Schema.Types.ObjectId,
            default: mongoose.Types.ObjectId
        },
        title: {
            type: String,
            required: true
        },
        content: {
            type: String,
            required: true,
        },
        date: {
            type: Date,
            default: Date.now
        },
        isRead: {
            type: Boolean,
            default: false
        }
    }]
});

module.exports = mongoose.model('AlertAdmin', alertSchema);
