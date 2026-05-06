const { createRouter, sendError, sendSuccess } = require('../api_helpers/routeFactory');
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
      fields: ['firstName', 'lastName', 'email', 'phone', 'preferredContactMethod'],
      required: ['firstName', 'lastName', 'email']
    },
    getInstructor: { fields: ['instructorId'], required: ['instructorId'] },
    getAllInstructors: { fields: [] },
    updateInstructor: {
      fields: ['instructorId', 'firstName', 'lastName', 'email', 'phone', 'preferredContactMethod'],
      required: ['instructorId']
    },
    deleteInstructor: { fields: ['instructorId'], required: ['instructorId'] },
  },
  handlers: {
    // Creates a new instructor; requires a matching User account (role instructor or manager) by email
    async addInstructor(req, res) {
      const { firstName, lastName, email, phone, preferredContactMethod } = req.body;

      const errors = Instructor.validate(req.body);
      if (errors.length)
        return sendError(res, 400, 'Validation Failed', errors.join('; '), BACK);

      // Email must link to an existing User with role instructor or manager
      const matchingUser = await User.findOne({ email: email.trim() }).lean();
      if (!matchingUser || !['instructor', 'manager'].includes(matchingUser.role))
        return sendError(res, 400, 'No Matching User Account', `No instructor or manager User account found with email "${email.trim()}". Create the User account first.`, BACK);

      // Prevent duplicate instructor records for the same email
      const existing = await Instructor.findOne({ email: email.trim() }).lean();
      if (existing)
        return sendError(res, 409, 'Instructor Already Exists', `An instructor record already exists for email "${email.trim()}" (ID: ${existing.instructorId})`, BACK);

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
      sendSuccess(res, 'Instructor Added Successfully', Instructor.serialize(doc.toObject()), BACK);
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
      const { instructorId, firstName, lastName, email, phone, preferredContactMethod } = req.body;

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
          return sendError(res, 400, 'No Matching User Account', `No instructor or manager User account found with email "${email.trim()}"`, BACK);

        const emailTaken = await Instructor.findOne({ email: email.trim(), instructorId: { $ne: instructorId.trim() } }).lean();
        if (emailTaken)
          return sendError(res, 409, 'Email Already In Use', `Another instructor record already uses email "${email.trim()}"`, BACK);

        doc.email = email.trim();
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
