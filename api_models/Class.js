const mongoose = require('mongoose');

// Duration options for studio classes.
// Label is stored in the DB; minutes include padding for instructor/customer arrival, setup, and attendance.
const DURATION_MINUTES = {
  Short: 60,    // 45 min class + 15 min padding
  Standard: 75, // 60 min class + 15 min padding
  Long: 90      // 75 min class + 15 min padding
};
const DURATION_VALUES = Object.keys(DURATION_MINUTES);

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// ClassSeries Schema - defines a recurring class schedule
const classSeriesSchema = new mongoose.Schema({
  classId: {
    type: String,
    required: true,
    unique: true
  },
  className: {
    type: String,
    required: true,
    trim: true
  },
  classType: {
    type: String,
    enum: ['General', 'Special'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  daysOfWeek: {
    type: [{ type: String, enum: DAYS_OF_WEEK }],
    required: true,
    validate: {
      validator: v => Array.isArray(v) && v.length > 0,
      message: 'At least one day of week is required'
    }
  },
  startTime: {
    type: String,
    required: true,
    match: [/^\d{2}:\d{2}$/, 'Start time must be in HH:MM format']
  },
  duration: {
    type: String,
    enum: DURATION_VALUES,
    required: true
  },
  // Optional default instructor assigned to all generated instances
  defaultInstructorId: {
    type: String,
    default: null
  },
  maxCapacity: {
    type: Number,
    default: 20,
    min: [1, 'Max capacity must be at least 1']
  },
  payRate: {
    type: Number,
    required: true,
    min: [0, 'Pay rate cannot be negative']
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

// Validates raw form data for ClassSeries creation; returns an array of error strings
classSeriesSchema.statics.validate = function (data) {
  const errors = [];
  if (!data.className || !data.className.trim())
    errors.push('Class name is required');
  if (!data.classType || !['General', 'Special'].includes(data.classType))
    errors.push('Class type must be "General" or "Special"');
  if (!data.startDate)
    errors.push('Start date is required');
  if (!data.endDate)
    errors.push('End date is required');
  if (data.startDate && data.endDate && new Date(data.startDate + 'T00:00:00Z') >= new Date(data.endDate + 'T00:00:00Z'))
    errors.push('End date must be after start date');
  const days = Array.isArray(data.daysOfWeek) ? data.daysOfWeek : (data.daysOfWeek ? [data.daysOfWeek] : []);
  if (days.length === 0)
    errors.push('At least one day of week is required');
  const invalidDays = days.filter(d => !DAYS_OF_WEEK.includes(d));
  if (invalidDays.length > 0)
    errors.push(`Invalid day(s) of week: ${invalidDays.join(', ')}`);
  if (!data.startTime || !/^\d{2}:\d{2}$/.test(data.startTime))
    errors.push('Start time is required and must be in HH:MM format');
  if (!data.duration || !DURATION_VALUES.includes(data.duration))
    errors.push(`Duration must be one of: ${DURATION_VALUES.join(', ')}`);
  if (data.payRate === undefined || data.payRate === null || data.payRate === '')
    errors.push('Pay rate is required');
  else if (isNaN(Number(data.payRate)) || Number(data.payRate) < 0)
    errors.push('Pay rate must be a non-negative number');
  return errors;
};

// Serializes a ClassSeries document for API responses
classSeriesSchema.statics.serialize = function (doc) {
  return {
    classId: doc.classId,
    className: doc.className,
    classType: doc.classType,
    startDate: doc.startDate instanceof Date ? doc.startDate.toISOString().split('T')[0] : doc.startDate,
    endDate: doc.endDate instanceof Date ? doc.endDate.toISOString().split('T')[0] : doc.endDate,
    daysOfWeek: doc.daysOfWeek,
    startTime: doc.startTime,
    duration: doc.duration,
    durationMinutes: DURATION_MINUTES[doc.duration],
    defaultInstructorId: doc.defaultInstructorId,
    maxCapacity: doc.maxCapacity,
    payRate: doc.payRate,
    isActive: doc.isActive
  };
};

const ClassSeries = mongoose.model('ClassSeries', classSeriesSchema);

// ClassInstance Schema - one record per individual class meeting
const classInstanceSchema = new mongoose.Schema({
  instanceId: {
    type: String,
    required: true,
    unique: true
  },
  // FK to ClassSeries
  classId: {
    type: String,
    required: true
  },
  // UTC midnight of the class date
  instanceDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true,
    match: [/^\d{2}:\d{2}$/, 'Start time must be in HH:MM format']
  },
  duration: {
    type: String,
    enum: DURATION_VALUES,
    required: true
  },
  instructorId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'cancelled', 'completed'],
    default: 'scheduled'
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

// One instance per series per date
classInstanceSchema.index({ classId: 1, instanceDate: 1 }, { unique: true });
// Used for studio conflict queries
classInstanceSchema.index({ instanceDate: 1, startTime: 1 });

// Serializes a ClassInstance document for API responses
classInstanceSchema.statics.serialize = function (doc) {
  return {
    instanceId: doc.instanceId,
    classId: doc.classId,
    instanceDate: doc.instanceDate instanceof Date ? doc.instanceDate.toISOString().split('T')[0] : doc.instanceDate,
    startTime: doc.startTime,
    duration: doc.duration,
    durationMinutes: DURATION_MINUTES[doc.duration],
    instructorId: doc.instructorId,
    status: doc.status,
    notes: doc.notes
  };
};

const ClassInstance = mongoose.model('ClassInstance', classInstanceSchema);

module.exports = { ClassSeries, ClassInstance, DURATION_MINUTES, DURATION_VALUES, DAYS_OF_WEEK };
