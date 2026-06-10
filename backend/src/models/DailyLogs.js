const mongoose = require('mongoose');

const dailyLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dateString: {
    type: String, // Stored as "YYYY-MM-DD" for easy calendar matching
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
  totalTasks: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['perfect', 'good', 'missed', 'empty'],
    default: 'empty'
  }
}, { timestamps: true });

// Ensure a user can only have one log per specific date
dailyLogSchema.index({ user: 1, dateString: 1 }, { unique: true });

module.exports = mongoose.model('DailyLog', dailyLogSchema);