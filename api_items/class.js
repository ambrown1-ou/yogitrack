const { createRouter } = require('../api_helpers/routeFactory');

// TODO: Replace these stubbed method definitions with Class model handlers.
module.exports = createRouter({
	moduleTitle: 'Class',
	basePath: '/api/class',
	methods: {
		addClass: {
			fields: ['instructorId', 'dayOfWeek', 'classTime', 'classType', 'payRate'],
			required: ['instructorId', 'dayOfWeek', 'classTime', 'classType', 'payRate']
		},
		getClass: {
			fields: ['classId'],
			required: ['classId']
		},
		getAll: {
			fields: []
		},
		updateClass: {
			fields: ['classId', 'instructorId', 'dayOfWeek', 'classTime', 'classType', 'payRate'],
			required: ['classId']
		},
		deleteClass: {
			fields: ['classId'],
			required: ['classId']
		},
	}
});