/*
  Auth Module: Handles registration, login, session, and logout for manager and instructor users.
  1. Register: POST username, password, and role -> password is hashed -> user saved to DB
  2. Login: POST username and password -> verify credentials -> create session
  3. Get User: GET current user from session -> return user info if authenticated
  4. Logout: POST to destroy the session and clear auth state
*/

const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const User = require('../models/User');

// POST /api/auth/register - Create new user account with username, password, and role
router.post('/register', async (req, res) => {
  try {
    const { username, password, role, email } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Username, password, and role are required'
      });
    }

    if (!['manager', 'instructor'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be "manager" or "instructor"'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create new user
    const user = new User({
      username,
      password,
      role,
      email: email || `${username}@yogitrack.local`
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        _id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({
      success: false,
      message: 'Registration failed: ' + err.message
    });
  }
});

// POST /api/auth/login - Verify credentials, update last login, and create session
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Store user info in session
    req.session.userId = user._id;
    req.session.username = user.username;
    req.session.role = user.role;

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        _id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      message: 'Login failed: ' + err.message
    });
  }
});

// GET /api/auth/user - Return the currently authenticated user from the session
router.get('/user', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Auth check error:', err);
    res.status(500).json({
      success: false,
      message: 'Auth check failed: ' + err.message
    });
  }
});

// POST /api/auth/logout - Destroy the session and log the user out
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });
  });
});

module.exports = router;
