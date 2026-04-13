const mongoose = require('mongoose');

// Class Schema - recurring weekly schedule
const classSchema = new mongoose.Schema({
  classId: {
    type: String,
    required: true,
    unique: true
  },
  instructorId: {
    type: String,
    required: true
  },
  dayOfWeek: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true
  },
  classTime: {
    type: String,
    required: true
  },
  classType: {
    type: String,
    enum: ['General', 'Special'],
    required: true
  },
  payRate: {
    type: Number,
    required: true,
    min: [0, 'Pay rate cannot be negative']
  },
  maxCapacity: {
    type: Number,
    default: 20
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index to help detect schedule conflicts (only one class per day+time)
classSchema.index({ dayOfWeek: 1, classTime: 1 });

module.exports = mongoose.model('Class', classSchema);
