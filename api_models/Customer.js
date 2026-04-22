const mongoose = require('mongoose');

// Customer Schema
const customerSchema = new mongoose.Schema({
  customerId: {
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
  dateOfBirth: {
    type: Date
  },
  preferredContactMethod: {
    type: String,
    enum: ['email', 'phone'],
    default: 'email'
  },
  classBalance: {
    type: Number,
    default: 0
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  packages: [
    {
      packageId: {
        type: String,
        required: true
      },
      expirationDate: {
        type: Date,
        required: true
      },
      classBalance: {
        type: Number,
        default: 0
      },
      unlimited: {
        type: Boolean,
        default: false
      }
    }
  ],
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
customerSchema.statics.validate = function(data) {
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

// Serializes a Customer document to a plain API response object with formatted dates
customerSchema.statics.serialize = function(doc) {
  // Helper to format dates as YYYY-MM-DD
  const formatDateField = function(value) {
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    return value;
  };
  return {
    customerId: doc.customerId,
    firstName: doc.firstName,
    lastName: doc.lastName,
    email: doc.email,
    phone: doc.phone,
    address: doc.address,
    dateOfBirth: formatDateField(doc.dateOfBirth),
    preferredContactMethod: doc.preferredContactMethod,
    classBalance: doc.classBalance,
    joinDate: formatDateField(doc.joinDate),
    packages: doc.packages || [],
    isActive: doc.isActive
  };
};

// Create and export the Customer model
module.exports = mongoose.model('Customer', customerSchema);
