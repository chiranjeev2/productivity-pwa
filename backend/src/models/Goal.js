const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['short-term', 'long-term'], // Keeps it organized
        required: true
    },
    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    color: {
        type: String,
        default: '#3b82f6' // Default blue
    }
}, { timestamps: true });

module.exports = mongoose.model('Goal', goalSchema);