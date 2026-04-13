const mongoose = require('mongoose');

// Package Schema - catalog/template definition
const packageSchema = new mongoose.Schema({
  packageId: {
    type: String,
    required: true,
    unique: true
  },
  packageName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['General', 'Senior', 'Beginner'],
    required: true
  },
  numberOfClasses: {
    type: Number,
    required: true,
    validate: {
      validator: v => v === -1 || (Number.isInteger(v) && v > 0),
      message: 'numberOfClasses must be a positive integer or -1 (unlimited)'
    }
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    trim: true
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

module.exports = mongoose.model('Package', packageSchema);
