const mongoose = require('mongoose');

const dailyLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dateString: {
    type: String, // Stored as "YYYY-MM-DD" so the calendar can easily match it
    required: true
  },
  waterIntake: {
    type: Number,
    default: 0
  },
  tasksCompleted: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['perfect', 'good', 'missed', 'empty'],
    default: 'empty'
  }
}, { timestamps: true });

// This ensures a user can only have ONE log per specific calendar day
dailyLogSchema.index({ userId: 1, dateString: 1 }, { unique: true });

module.exports = mongoose.model('DailyLog', dailyLogSchema);