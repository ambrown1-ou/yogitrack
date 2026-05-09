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
    trim: true,
    maxlength: 100
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  // Email is required and unique; serves as the join key linking this record to a User account
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 200,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format']
  },
  phone: {
    type: String,
    trim: true,
    maxlength: 20
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
  else if (data.firstName.trim().length > 100)
    errors.push("First name must be 100 characters or fewer");
  if (!data.lastName || typeof data.lastName !== 'string' || data.lastName.trim().length === 0)
    errors.push("Last name is required");
  else if (data.lastName.trim().length > 100)
    errors.push("Last name must be 100 characters or fewer");
  if (!data.email || typeof data.email !== 'string' || data.email.trim().length === 0)
    errors.push("Email is required");
  else if (data.email.trim().length > 200)
    errors.push("Email must be 200 characters or fewer");
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()))
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
    preferredContactMethod: doc.preferredContactMethod,
    isActive: doc.isActive
  };
};

module.exports = mongoose.model('Instructor', instructorSchema);
