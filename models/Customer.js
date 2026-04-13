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

// Create and export the Customer model
module.exports = mongoose.model('Customer', customerSchema);
