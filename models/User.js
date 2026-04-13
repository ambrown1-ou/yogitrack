const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['manager', 'instructor'],
    required: true
  },
  email: {
    type: String,
    required: false,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Validates raw form data for user registration; returns an array of error strings
userSchema.statics.validate = function(data) {
  const errors = [];
  if (!data.username || !data.password || !data.role)
    errors.push('Username, password, and role are required');
  if (data.role && !['manager', 'instructor'].includes(data.role))
    errors.push('Role must be "manager" or "instructor"');
  return errors;
};

// Returns a safe subset of user fields for API responses (excludes password)
userSchema.statics.toResponse = function(user) {
  return {
    _id: user._id,
    username: user.username,
    role: user.role
  };
};

// Compares a plain-text password against this user's stored hash
userSchema.methods.verifyPassword = function(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
