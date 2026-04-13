const mongoose = require('mongoose');

// Attendance Schema - one record per customer per class occurrence
const attendanceSchema = new mongoose.Schema({
  attendanceId: {
    type: String,
    required: true,
    unique: true
  },
  classId: {
    type: String,
    required: true
  },
  instructorId: {
    type: String,
    required: true
  },
  customerId: {
    type: String,
    required: true
  },
  attendanceDate: {
    type: Date,
    required: true
  },
  attendanceTime: {
    type: String
  },
  // Scheduled day/time from class, stored for mismatch detection
  scheduledDay: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  scheduledTime: {
    type: String
  },
  scheduleMismatch: {
    type: Boolean,
    default: false
  },
  // Which sale/package purchase was used
  saleId: {
    type: String
  },
  // Balance audit trail
  beforeBalance: {
    type: Number
  },
  afterBalance: {
    type: Number
  },
  negativeBalanceOverride: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for reporting queries
attendanceSchema.index({ classId: 1, attendanceDate: 1 });
attendanceSchema.index({ customerId: 1 });
attendanceSchema.index({ instructorId: 1, attendanceDate: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
