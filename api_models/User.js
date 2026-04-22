const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (err) {
    throw new Error(`Password hashing failed: ${err.message}`);
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

// Validates login form data; returns an array of error strings
userSchema.statics.validateLogin = function(data) {
  const errors = [];
  if (!data.username || !data.password)
    errors.push('Username and password are required');
  return errors;
};

// Normalizes a raw username string
userSchema.statics.normalizeUsername = function(username) {
  return String(username).trim();
};

// Finds a user by username (case-sensitive, trimmed)
userSchema.statics.findByUsername = function(username) {
  return this.findOne({ username: String(username).trim() });
};

// Verifies credentials and updates lastLogin; returns the authenticated user or null
userSchema.statics.authenticate = async function(username, password) {
  const user = await this.findOne({ username: String(username).trim() });
  if (!user) return null;
  const valid = await user.verifyPassword(password);
  if (!valid) return null;
  user.lastLogin = new Date();
  await user.save();
  return user;
};

// Returns a safe subset of user fields for API responses (excludes password)
userSchema.statics.toResponse = function(user) {
  return {
    _id: user._id,
    username: user.username,
    role: user.role
  };
};

// Returns all users as safe response objects (excludes passwords)
userSchema.statics.getAllUsers = async function() {
  const users = await this.find({}).lean();
  return users.map(u => ({ _id: u._id, username: u.username, role: u.role }));
};

// Compares a plain-text password against this user's stored hash
userSchema.methods.verifyPassword = function(password) {
  return bcrypt.compare(password, this.password);
};

// Hashes a plain-text password
userSchema.statics.hashPassword = async function(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

module.exports = mongoose.model('User', userSchema);