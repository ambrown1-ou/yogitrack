const { createRouter } = require('../modules/routeFactory');

// TODO: Replace these stubbed method definitions with Attendance model handlers.
module.exports = createRouter({
  moduleTitle: 'Attendance',
  basePath: '/api/attendance',
  methods: {
    recordAttendance: { fields: ['classId', 'customerId', 'attendanceDate', 'attendanceTime'], required: ['classId', 'customerId'] },
    getAttendance: { fields: ['attendanceId'], required: ['attendanceId'] },
    getByClass: { fields: ['classId'], required: ['classId'] },
    getByCustomer: { fields: ['customerId'], required: ['customerId'] },
    getAll: { fields: [] },
    deleteAttendance: { fields: ['attendanceId'], required: ['attendanceId'] },
  }
});
