const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const alertSchema = new Schema({
    industry_id: {
        type: Schema.Types.ObjectId,
        ref: 'Industry', 
        required: true
    },
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
        },
        alert_type: {
            type: String,
            enum: ['zone', 'industry'],
            required: true
        }
    }]
});

module.exports = mongoose.model('Alert', alertSchema);
