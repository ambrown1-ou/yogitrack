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

// Validates raw form data before document creation or update; returns an array of error strings
packageSchema.statics.validate = function(data) {
  const errors = [];
  if (!data.packageName || typeof data.packageName !== 'string' || data.packageName.trim().length === 0)
    errors.push("Package name is required");
  if (!data.category || !['General', 'Senior', 'Beginner'].includes(data.category))
    errors.push("Category must be 'General', 'Senior', or 'Beginner'");
  if (!data.numberOfClasses || (String(data.numberOfClasses) !== 'unlimited' && (!Number.isInteger(Number(data.numberOfClasses)) || Number(data.numberOfClasses) < 1)))
    errors.push("Number of classes must be a positive whole number or 'unlimited'");
  if (!data.startDate || isNaN(Date.parse(data.startDate)))
    errors.push("Valid start date is required");
  if (!data.endDate || isNaN(Date.parse(data.endDate)))
    errors.push("Valid end date is required");
  if (data.startDate && data.endDate && !isNaN(Date.parse(data.startDate)) && !isNaN(Date.parse(data.endDate)) && new Date(data.startDate) >= new Date(data.endDate))
    errors.push("End date must be after start date");
  if (String(data.numberOfClasses) !== 'unlimited' && data.startDate && data.endDate && !isNaN(Date.parse(data.startDate)) && !isNaN(Date.parse(data.endDate))) {
    const days = Math.floor((new Date(data.endDate) - new Date(data.startDate)) / (1000 * 60 * 60 * 24));
    if (Number(data.numberOfClasses) > days)
      errors.push(`Number of classes (${data.numberOfClasses}) cannot exceed the number of days in the validity period (${days})`);
  }
  if (!data.price || isNaN(parseFloat(data.price)) || parseFloat(data.price) < 0)
    errors.push("Price must be a valid positive number");
  return errors;
};

// Serializes a Package document to a plain API response object with formatted dates
packageSchema.statics.serialize = function(doc) {
  const fmt = val => val instanceof Date ? val.toISOString().split('T')[0] : val;
  return {
    packageId: doc.packageId,
    packageName: doc.packageName,
    category: doc.category,
    numberOfClasses: doc.numberOfClasses === -1 ? 'unlimited' : doc.numberOfClasses,
    startDate: fmt(doc.startDate),
    endDate: fmt(doc.endDate),
    price: doc.price,
    isActive: doc.isActive
  };
};

module.exports = mongoose.model('Package', packageSchema);
