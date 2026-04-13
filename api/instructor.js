const { createRouter } = require('../modules/routeFactory');

// TODO: Replace these stubbed method definitions with Instructor model handlers.
module.exports = createRouter({
  moduleTitle: 'Instructor',
  basePath: '/api/instructor',
  methods: {
    addInstructor: { fields: ['firstName', 'lastName', 'address', 'phone', 'email', 'preferredContactMethod'], required: ['firstName', 'lastName'] },
    getInstructor: { fields: ['instructorId'], required: ['instructorId'] },
    getAll: { fields: [] },
    updateInstructor: { fields: ['instructorId', 'firstName', 'lastName', 'address', 'phone', 'email', 'preferredContactMethod'], required: ['instructorId'] },
    deleteInstructor: { fields: ['instructorId'], required: ['instructorId'] },
  }
});
