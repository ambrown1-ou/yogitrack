/*
  User Module: Handles registration, login, session, and logout for manager and instructor users.
  1. Register: POST username, password, and role -> password is hashed -> user saved to DB
  2. Login: POST username and password -> verify credentials -> create session
  3. GetCurrentUser: POST to retrieve current user from session
  4. Logout: POST to destroy the session and clear auth state
*/

const { createRouter, sendError, sendSuccess } = require('../api_helpers/routeFactory');
const User = require('../api_models/User');
const BACK = '/api/user';

// Route handlers for browser-friendly user auth actions
module.exports = createRouter({
  moduleTitle: 'User',
  basePath: BACK,
  methods: {
    register: { fields: ['username', 'password', 'role', 'email'] },
    login: { fields: ['username', 'password'] },
    getCurrentUser: { fields: [] },
    getAllUsers: { fields: [] },
    logout: { fields: [] }
  },
  handlers: {
    // Create a new user account for manager/instructor roles
    async register(req, res) {
      const { username, password, role, email } = req.body;

      const errors = User.validate(req.body);
      if (errors.length) return sendError(res, 400, 'Validation Failed', errors.join('; '), BACK);

      const normalizedUsername = User.normalizeUsername(username);
      const existingUser = await User.findByUsername(normalizedUsername);
      if (existingUser) {
        return sendError(res, 409, 'User Already Exists', `A user with username "${normalizedUsername}" already exists`, BACK);
      }

      // Create and save the new user; password hashed by pre-save hook
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
      const errors = User.validateLogin(req.body);
      if (errors.length) return sendError(res, 400, 'Missing Required Fields', errors.join('; '), BACK);

      const user = await User.authenticate(req.body.username, req.body.password);
      if (!user) {
        return sendError(res, 401, 'Authentication Failed', 'Invalid username or password', BACK);
      }

      req.session.userId = user._id;
      req.session.username = user.username;
      req.session.role = user.role;

      if (req.body._browserForm === '1') return res.redirect('/api');
      sendSuccess(res, 'Login Successful', User.toResponse(user), BACK);
    },

    // Return all registered users
    async getAllUsers(req, res) {
      const users = await User.getAllUsers();
      sendSuccess(res, `Retrieved ${users.length} User(s)`, users, BACK);
    },

    // Return the authenticated user tied to the current session
    async getCurrentUser(req, res) {
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
      const browserForm = req.body._browserForm === '1';
      req.session.destroy((err) => {
        if (err) {
          return sendError(res, 500, 'Logout Failed', 'Unable to end the session', BACK);
        }

        if (browserForm) return res.redirect('/api');
        sendSuccess(res, 'Logout Successful', { loggedOut: true }, BACK);
      });
    }
  }
});
