/*
  Auth Module: Handles registration, login, session, and logout for manager and instructor users.
  1. Register: POST username, password, and role -> password is hashed -> user saved to DB
  2. Login: POST username and password -> verify credentials -> create session
  3. Get User: POST to retrieve current user from session
  4. Logout: POST to destroy the session and clear auth state
*/

const bcrypt = require('bcrypt');
const { createRouter, sendError, sendSuccess } = require('../modules/routeFactory');
const User = require('../models/User');
const BACK = '/api/auth';

// Returns a safe user payload for responses
function getUserResponse(user) {
  return {
    _id: user._id,
    username: user.username,
    role: user.role
  };
}

// Route handlers for browser-friendly auth actions
module.exports = createRouter({
  moduleTitle: 'Auth',
  basePath: BACK,
  methods: {
    register: { fields: ['username', 'password', 'role', 'email'] },
    login: { fields: ['username', 'password'] },
    user: { fields: [] },
    logout: { fields: [] }
  },
  handlers: {
    // Create a new user account for manager/instructor roles
    async register(req, res) {
      try {
        const { username, password, role, email } = req.body;

        if (!username || !password || !role) {
          return sendError(res, 400, 'Missing Required Fields', 'Username, password, and role are required', BACK);
        }

        if (!['manager', 'instructor'].includes(role)) {
          return sendError(res, 400, 'Invalid Role', 'Role must be "manager" or "instructor"', BACK);
        }

        const normalizedUsername = String(username).trim();
        const existingUser = await User.findOne({ username: normalizedUsername });
        if (existingUser) {
          return sendError(res, 409, 'User Already Exists', `A user with username "${normalizedUsername}" already exists`, BACK);
        }

        const user = new User({
          username: normalizedUsername,
          password,
          role,
          email: email || `${normalizedUsername}@yogitrack.local`
        });

        await user.save();
        sendSuccess(res, 'User Registered Successfully', getUserResponse(user), BACK);
      } catch (err) {
        console.error('Register error:', err);
        sendError(res, 500, 'Registration Failed', err.message, BACK);
      }
    },

    // Verify credentials and establish a session
    async login(req, res) {
      try {
        const { username, password } = req.body;

        if (!username || !password) {
          return sendError(res, 400, 'Missing Required Fields', 'Username and password are required', BACK);
        }

        const normalizedUsername = String(username).trim();
        const user = await User.findOne({ username: normalizedUsername });
        if (!user) {
          return sendError(res, 401, 'Authentication Failed', 'Invalid username or password', BACK);
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return sendError(res, 401, 'Authentication Failed', 'Invalid username or password', BACK);
        }

        user.lastLogin = new Date();
        await user.save();

        req.session.userId = user._id;
        req.session.username = user.username;
        req.session.role = user.role;

        sendSuccess(res, 'Login Successful', getUserResponse(user), BACK);
      } catch (err) {
        console.error('Login error:', err);
        sendError(res, 500, 'Login Failed', err.message, BACK);
      }
    },

    // Return the authenticated user tied to the current session
    async user(req, res) {
      try {
        if (!req.session.userId) {
          return sendError(res, 401, 'Not Authenticated', 'No active login session found', BACK);
        }

        const user = await User.findById(req.session.userId);
        if (!user) {
          return sendError(res, 401, 'User Not Found', 'Session user no longer exists', BACK);
        }

        sendSuccess(res, 'Authenticated User', getUserResponse(user), BACK);
      } catch (err) {
        console.error('Get user error:', err);
        sendError(res, 500, 'Auth Check Failed', err.message, BACK);
      }
    },

    // End the current session
    logout(req, res) {
      req.session.destroy((err) => {
        if (err) {
          return sendError(res, 500, 'Logout Failed', 'Unable to end the session', BACK);
        }

        sendSuccess(res, 'Logout Successful', { loggedOut: true }, BACK);
      });
    }
  }
});
