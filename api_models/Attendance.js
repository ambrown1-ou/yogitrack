const mongoose = require('mongoose');

// Attendance Schema - one record per customer per class instance
const attendanceSchema = new mongoose.Schema({
  attendanceId: {
    type: String,
    required: true,
    unique: true
  },
  // FK to ClassInstance
  instanceId: {
    type: String,
    required: true
  },
  // Denormalized from instance at record time for reporting without joins
  instructorId: {
    type: String,
    required: true
  },
  customerId: {
    type: String,
    required: true
  },
  // UTC midnight of the attendance date
  attendanceDate: {
    type: Date,
    required: true
  },
  attendanceTime: {
    type: String
  },
  // Which sale/package purchase was used (optional; falls back to global classBalance)
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
    trim: true,
    maxlength: 1000
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for reporting queries
attendanceSchema.index({ instanceId: 1 });
attendanceSchema.index({ customerId: 1 });
attendanceSchema.index({ instructorId: 1, attendanceDate: 1 });

// Serializes an Attendance document for API responses
attendanceSchema.statics.serialize = function (doc) {
  return {
    attendanceId: doc.attendanceId,
    instanceId: doc.instanceId,
    instructorId: doc.instructorId,
    customerId: doc.customerId,
    attendanceDate: doc.attendanceDate instanceof Date ? doc.attendanceDate.toISOString().split('T')[0] : doc.attendanceDate,
    attendanceTime: doc.attendanceTime,
    saleId: doc.saleId,
    beforeBalance: doc.beforeBalance,
    afterBalance: doc.afterBalance,
    negativeBalanceOverride: doc.negativeBalanceOverride,
    notes: doc.notes
  };
};

module.exports = mongoose.model('Attendance', attendanceSchema);
