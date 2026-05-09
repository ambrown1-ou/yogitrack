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
    changePassword: { fields: ['newPassword', 'confirmPassword'], required: ['newPassword'] },
    resetPassword: { fields: ['username'], required: ['username'] },
    logout: { fields: [] }
  },
  handlers: {
    // Create a new user account for manager/instructor roles
    async register(req, res) {
      if (req.session.role !== 'manager') {
        return sendError(res, 403, 'Forbidden', 'Only managers can register new user accounts', BACK);
      }

      const { username, password, role, email } = req.body;

      const errors = User.validate(req.body);
      if (errors.length) return sendError(res, 400, 'Validation Failed', errors.join('; '), BACK);

      const normalizedUsername = User.normalizeUsername(username);
      const existingUser = await User.findByUsername(normalizedUsername);
      if (existingUser) {
        return sendError(res, 409, 'User Already Exists', `A user with username "${normalizedUsername}" already exists`, BACK);
      }

      // Reject if email is already in use by another user account
      if (email && email.trim()) {
        const emailExists = await User.findOne({ email: email.trim() }).lean();
        if (emailExists)
          return sendError(res, 409, 'Email Already In Use', `A user account already exists with email "${email.trim()}"`, BACK);
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
      if (req.session.role !== 'manager') {
        return sendError(res, 403, 'Forbidden', 'Only managers can view all users', BACK);
      }
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

    // Change the password for the currently logged-in user; clears firstLogin flag
    async changePassword(req, res) {
      if (!req.session.userId) {
        return sendError(res, 401, 'Not Authenticated', 'No active login session found', BACK);
      }

      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 6) {
        return sendError(res, 400, 'Validation Failed', 'New password must be at least 6 characters', BACK);
      }

      const user = await User.findById(req.session.userId);
      if (!user) {
        return sendError(res, 401, 'User Not Found', 'Session user no longer exists', BACK);
      }

      user.password = newPassword; // pre-save hook will hash it
      user.mustChangePassword = false;
      await user.save();

      sendSuccess(res, 'Password Changed Successfully', User.toResponse(user), BACK);
    },

    // Resets another user's password to a temporary value; manager only; adminuser is protected
    async resetPassword(req, res) {
      if (req.session.role !== 'manager') {
        return sendError(res, 403, 'Forbidden', 'Only managers can reset passwords', BACK);
      }

      const { username } = req.body;
      const normalized = User.normalizeUsername(username);

      if (normalized.toLowerCase() === 'adminuser') {
        return sendError(res, 403, 'Forbidden', 'The adminuser account cannot be reset through the API. Log in as adminuser and use changePassword instead.', BACK);
      }

      const user = await User.findByUsername(normalized);
      if (!user) {
        return sendError(res, 404, 'User Not Found', `No user found with username "${normalized}"`, BACK);
      }

      // TODO: This should  be updated to a more secure temp password generation method.
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
      const tempPassword = 'Yogi' + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

      user.password = tempPassword;
      user.mustChangePassword = true;
      await user.save();

      sendSuccess(res, 'Password Reset Successfully', Object.assign(User.toResponse(user), { tempPassword }), BACK);
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
