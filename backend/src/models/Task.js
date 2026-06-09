const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  // This links the task directly to the User who created it
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  completed: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);