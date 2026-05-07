const { createRouter, sendError, sendSuccess, sendConfirmation } = require('../api_helpers/routeFactory');
const Instructor = require('../api_models/Instructor');
const User = require('../api_models/User');
const { ClassInstance } = require('../api_models/Class');
const { generateId } = require('../api_helpers/idGenerator');

const BACK = '/api/instructor';

module.exports = createRouter({
  moduleTitle: 'Instructor',
  basePath: BACK,
  methods: {
    addInstructor: {
      fields: ['firstName', 'lastName', 'email', 'phone', 'preferredContactMethod', 'username', 'confirmDuplicate'],
      required: ['firstName', 'lastName', 'email']
    },
    getInstructor: { fields: ['instructorId'], required: ['instructorId'] },
    getAllInstructors: { fields: [] },
    updateInstructor: {
      fields: ['instructorId', 'firstName', 'lastName', 'email', 'phone', 'preferredContactMethod', 'confirmDuplicate'],
      required: ['instructorId']
    },
    deleteInstructor: { fields: ['instructorId'], required: ['instructorId'] },
  },
  handlers: {
    // Creates a new instructor; auto-creates a User account if none exists for the given email.
    // When a User is auto-created a temporary password is returned in the response.
    async addInstructor(req, res) {
      const { firstName, lastName, email, phone, preferredContactMethod, username, confirmDuplicate } = req.body;

      const errors = Instructor.validate(req.body);
      if (errors.length)
        return sendError(res, 400, 'Validation Failed', errors.join('; '), BACK);

      // Prevent duplicate instructor records for the same email
      const existing = await Instructor.findOne({ email: email.trim() }).lean();
      if (existing)
        return sendError(res, 409, 'Instructor Already Exists', `An instructor record already exists for email "${email.trim()}" (ID: ${existing.instructorId})`, BACK);

      // Duplicate name warning - allow proceed with confirmation
      if (confirmDuplicate !== 'true') {
        const sameName = await Instructor.findOne({
          firstName: new RegExp(`^${firstName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
          lastName: new RegExp(`^${lastName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
        }).lean();
        if (sameName) {
          return sendConfirmation(res, {
            message: 'Duplicate Instructor Name Found',
            details: `An instructor named "${firstName.trim()} ${lastName.trim()}" already exists (ID: ${sameName.instructorId}). Do you want to add another instructor with the same name?`,
            action: `${BACK}/addInstructor`,
            formData: req.body,
            extraFields: { confirmDuplicate: 'true' },
            confirmText: 'Yes, Add Instructor',
            backUrl: BACK
          });
        }
      }

      // Auto-create a User account if one doesn't already exist for this email.
      // Case-insensitive lookup so casing differences don't accidentally create duplicates.
      let tempPassword = null;
      let tempUsername = null;
      let linkedToExisting = false;
      const emailSafe = email.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      let matchingUser = await User.findOne({ email: new RegExp(`^${emailSafe}$`, 'i') }).lean();

      if (!matchingUser) {
        // No existing account — create one with a temporary password
        // Derive a username: firstname.lastname, lowercase, with collision avoidance
        const baseUsername = (firstName.trim() + '.' + lastName.trim()).toLowerCase().replace(/[^a-z0-9.]/g, '');
        const providedUsername = username ? username.trim().toLowerCase() : null;
        let candidateUsername = providedUsername || baseUsername;

        // Ensure uniqueness
        let suffix = 2;
        while (await User.findByUsername(candidateUsername)) {
          candidateUsername = (providedUsername || baseUsername) + suffix;
          suffix++;
        }

        // Generate a temporary password: "Yogi" + 6 random alphanumeric chars
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        tempPassword = 'Yogi' + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

        const newUser = new User({
          username: candidateUsername,
          password: tempPassword, // pre-save hook hashes it
          role: 'instructor',
          email: email.trim()
          // lastLogin left null (default) — signals first-login password change required
        });
        await newUser.save();
        matchingUser = newUser;
        tempUsername = candidateUsername;
      } else if (matchingUser.role === 'manager' || matchingUser.role === 'instructor') {
        // Existing manager or instructor account — reuse it, no new password needed
        linkedToExisting = true;
      } else {
        return sendError(res, 400, 'Invalid User Account', `A User account exists for email "${email.trim()}" but has role "${matchingUser.role}". Only manager or instructor accounts can be linked to an instructor record.`, BACK);
      }

      const instructorId = await generateId('instructor');
      const doc = new Instructor({
        instructorId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone ? phone.trim() : '',
        preferredContactMethod: preferredContactMethod || 'email',
        isActive: true
      });
      await doc.save();

      const responseData = Object.assign({ tempUsername, tempPassword, linkedToExisting }, Instructor.serialize(doc.toObject()));
      const msg = linkedToExisting
        ? 'Instructor Added — Linked to Existing Account'
        : 'Instructor Added Successfully';
      sendSuccess(res, msg, responseData, BACK);
    },

    // Retrieves a single instructor by instructorId
    async getInstructor(req, res) {
      const { instructorId } = req.body;
      const doc = await Instructor.findOne({ instructorId: instructorId.trim() }).lean();
      if (!doc)
        return sendError(res, 404, 'Instructor Not Found', `No instructor found with ID: ${instructorId}`, BACK);
      sendSuccess(res, 'Instructor Retrieved', Instructor.serialize(doc), BACK);
    },

    // Returns all active instructor records
    async getAllInstructors(req, res) {
      const docs = await Instructor.find({ isActive: true }).lean();
      sendSuccess(res, `Retrieved ${docs.length} Instructor(s)`, docs.map(d => Instructor.serialize(d)), BACK);
    },

    // Updates editable fields on an instructor record; re-validates User link if email changes
    async updateInstructor(req, res) {
      const { instructorId, firstName, lastName, email, phone, preferredContactMethod, confirmDuplicate } = req.body;

      const doc = await Instructor.findOne({ instructorId: instructorId.trim() });
      if (!doc)
        return sendError(res, 404, 'Instructor Not Found', `No instructor found with ID: ${instructorId}`, BACK);

      // Validate only the fields being changed
      const validationTarget = {
        firstName: firstName || doc.firstName,
        lastName: lastName || doc.lastName,
        email: email || doc.email,
        phone: phone !== undefined ? phone : doc.phone,
        preferredContactMethod: preferredContactMethod || doc.preferredContactMethod
      };
      const errors = Instructor.validate(validationTarget);
      if (errors.length)
        return sendError(res, 400, 'Validation Failed', errors.join('; '), BACK);

      // If email is being changed, verify the new email still links to a valid User
      if (email && email.trim() !== doc.email) {
        const matchingUser = await User.findOne({ email: email.trim() }).lean();
        if (!matchingUser || !['instructor', 'manager'].includes(matchingUser.role))
          return sendError(res, 400, 'No Matching User Account', `No instructor or manager User account found with email "${email.trim()}". A matching User account is required when changing email.`, BACK);

        const emailTaken = await Instructor.findOne({ email: email.trim(), instructorId: { $ne: instructorId.trim() } }).lean();
        if (emailTaken)
          return sendError(res, 409, 'Email Already In Use', `Another instructor record already uses email "${email.trim()}"`, BACK);

        doc.email = email.trim();
      }

      // Name duplicate warning when name is being changed
      const newFirst = firstName ? firstName.trim() : doc.firstName;
      const newLast = lastName ? lastName.trim() : doc.lastName;
      const nameChanging = (firstName && firstName.trim() !== doc.firstName) || (lastName && lastName.trim() !== doc.lastName);
      if (nameChanging && confirmDuplicate !== 'true') {
        const sameName = await Instructor.findOne({
          firstName: new RegExp(`^${newFirst.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
          lastName: new RegExp(`^${newLast.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
          instructorId: { $ne: instructorId.trim() }
        }).lean();
        if (sameName) {
          return sendConfirmation(res, {
            message: 'Duplicate Instructor Name Found',
            details: `An instructor named "${newFirst} ${newLast}" already exists (ID: ${sameName.instructorId}). Do you want to rename this instructor to the same name?`,
            action: `${BACK}/updateInstructor`,
            formData: req.body,
            extraFields: { confirmDuplicate: 'true' },
            confirmText: 'Yes, Update Instructor',
            backUrl: BACK
          });
        }
      }

      if (firstName) doc.firstName = firstName.trim();
      if (lastName) doc.lastName = lastName.trim();
      if (phone !== undefined) doc.phone = phone.trim();
      if (preferredContactMethod) doc.preferredContactMethod = preferredContactMethod;

      await doc.save();
      sendSuccess(res, 'Instructor Updated', Instructor.serialize(doc.toObject()), BACK);
    },

    // Deletes an instructor; hard delete if no class instances reference them, soft delete otherwise
    async deleteInstructor(req, res) {
      const { instructorId } = req.body;

      const doc = await Instructor.findOne({ instructorId: instructorId.trim() }).lean();
      if (!doc)
        return sendError(res, 404, 'Instructor Not Found', `No instructor found with ID: ${instructorId}`, BACK);

      const instanceCount = await ClassInstance.countDocuments({ instructorId: instructorId.trim() });
      if (instanceCount > 0) {
        // Soft delete — keep record for historical reporting
        await Instructor.updateOne({ instructorId: instructorId.trim() }, { isActive: false });
        return sendSuccess(res, `Instructor marked inactive (referenced by ${instanceCount} class instance(s))`, { instructorId, deleted: false, isActive: false }, BACK);
      }

      await Instructor.deleteOne({ instructorId: instructorId.trim() });
      sendSuccess(res, 'Instructor Deleted', { instructorId, deleted: true }, BACK);
    }
  }
});
