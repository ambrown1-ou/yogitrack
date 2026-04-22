const mongoose = require('mongoose');

// Instructor Schema
const instructorSchema = new mongoose.Schema({
  instructorId: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format']
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  preferredContactMethod: {
    type: String,
    enum: ['email', 'phone'],
    default: 'email'
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
instructorSchema.statics.validate = function (data) {
  const errors = [];
  if (!data.firstName || typeof data.firstName !== 'string' || data.firstName.trim().length === 0)
    errors.push("First name is required");
  if (!data.lastName || typeof data.lastName !== 'string' || data.lastName.trim().length === 0)
    errors.push("Last name is required");
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    errors.push("Email must be valid");
  if (data.phone && !/^\d{10,}$/.test(data.phone.replace(/\D/g, '')))
    errors.push("Phone must contain at least 10 digits");
  if (data.preferredContactMethod && !['email', 'phone'].includes(data.preferredContactMethod))
    errors.push("Preferred contact method must be 'email' or 'phone'");
  return errors;
};

// Serializes an Instructor document to a plain API response object
instructorSchema.statics.serialize = function (doc) {
  return {
    instructorId: doc.instructorId,
    firstName: doc.firstName,
    lastName: doc.lastName,
    email: doc.email,
    phone: doc.phone,
    address: doc.address,
    preferredContactMethod: doc.preferredContactMethod,
    isActive: doc.isActive
  };
};

module.exports = mongoose.model('Instructor', instructorSchema);
