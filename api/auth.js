/*
  Auth Module: Handles registration, login, session, and logout for manager and instructor users.
  1. Register: POST username, password, and role -> password is hashed -> user saved to DB
  2. Login: POST username and password -> verify credentials -> create session
  3. Get User: POST to retrieve current user from session
  4. Logout: POST to destroy the session and clear auth state
*/

const { createRouter, sendError, sendSuccess } = require('../modules/routeFactory');
const User = require('../models/User');
const BACK = '/api/auth';

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
      const { username, password, role, email } = req.body;

      const errors = User.validate(req.body);
      if (errors.length) return sendError(res, 400, 'Validation Failed', errors.join('; '), BACK);

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
      sendSuccess(res, 'User Registered Successfully', User.toResponse(user), BACK);
    },

    // Verify credentials and establish a session
    async login(req, res) {
      const { username, password } = req.body;

      if (!username || !password) {
        return sendError(res, 400, 'Missing Required Fields', 'Username and password are required', BACK);
      }

      const normalizedUsername = String(username).trim();
      const user = await User.findOne({ username: normalizedUsername });
      if (!user) {
        return sendError(res, 401, 'Authentication Failed', 'Invalid username or password', BACK);
      }

      const isValidPassword = await user.verifyPassword(password);
      if (!isValidPassword) {
        return sendError(res, 401, 'Authentication Failed', 'Invalid username or password', BACK);
      }

      user.lastLogin = new Date();
      await user.save();

      req.session.userId = user._id;
      req.session.username = user.username;
      req.session.role = user.role;

      sendSuccess(res, 'Login Successful', User.toResponse(user), BACK);
    },

    // Return the authenticated user tied to the current session
    async user(req, res) {
      if (!req.session.userId) {
        return sendError(res, 401, 'Not Authenticated', 'No active login session found', BACK);
      }

      const user = await User.findById(req.session.userId);
      if (!user) {
        return sendError(res, 401, 'User Not Found', 'Session user no longer exists', BACK);
      }

      sendSuccess(res, 'Authenticated User', User.toResponse(user), BACK);
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
