/*
Form Helpers: Renders HTML forms and method-list pages for API modules.
Provides getFieldConfig() for field metadata, renderFieldInput() for individual
form inputs, renderForm() for full method forms, and renderMethodList() for
the index page of each API module.
 */

const { renderTemplate } = require('./templateEngine');

// Returns input type, label, and attributes for a given field name
function getFieldConfig(fieldName) {
	const configs = {
		// IDs
		instructorId: {
			type: 'text',
			placeholder: 'e.g., I00001',
			label: 'Instructor ID'
		},
		customerId: {
			type: 'text',
			placeholder: 'e.g., C00001',
			label: 'Customer ID'
		},
		classId: {
			type: 'text',
			placeholder: 'e.g., CL00001',
			label: 'Class Series ID'
		},
		packageId: {
			type: 'text',
			placeholder: 'e.g., P00001',
			label: 'Package ID'
		},
		saleId: {
			type: 'text',
			placeholder: 'e.g., S00001',
			label: 'Sale ID'
		},
		attendanceId: {
			type: 'text',
			placeholder: 'e.g., A00001',
			label: 'Attendance ID'
		},
		instanceId: {
			type: 'text',
			placeholder: 'e.g., CI00001',
			label: 'Instance ID'
		},

		// Names
		firstName: {
			type: 'text',
			placeholder: 'John',
			label: 'First Name',
			required: true
		},
		lastName: {
			type: 'text',
			placeholder: 'Doe',
			label: 'Last Name',
			required: true
		},
		username: {
			type: 'text',
			placeholder: 'manager01',
			label: 'Username',
			required: true
		},
		password: {
			type: 'password',
			placeholder: 'Enter password',
			label: 'Password',
			required: true
		},
		newPassword: {
			type: 'password',
			placeholder: 'Enter new password',
			label: 'New Password',
			required: true
		},
		confirmPassword: {
			type: 'password',
			placeholder: 'Confirm new password',
			label: 'Confirm Password',
			required: true
		},
		role: {
			type: 'select',
			options: ['manager', 'instructor', 'customer'],
			label: 'Role',
			required: true
		},

		// Contact
		email: {
			type: 'email',
			placeholder: 'john@example.com',
			label: 'Email',
			required: true
		},
		phone: {
			type: 'tel',
			placeholder: '(412) 555-0123',
			label: 'Phone',
			required: false
		},
		preferredContactMethod: {
			type: 'select',
			options: ['email', 'phone'],
			label: 'Preferred Contact Method'
		},

		// Address
		address: {
			type: 'text',
			placeholder: '123 Main St, City, State 12345',
			label: 'Address'
		},

		// Financial
		price: {
			type: 'number',
			step: '0.01',
			placeholder: '0.00',
			label: 'Price',
			min: '0'
		},
		payRate: {
			type: 'number',
			step: '0.01',
			placeholder: '0.00',
			label: 'Pay Rate',
			min: '0'
		},
		amountPaid: {
			type: 'number',
			step: '0.01',
			placeholder: '0.00',
			label: 'Amount Paid',
			min: '0'
		},
		classBalance: {
			type: 'number',
			placeholder: '0',
			label: 'Class Balance'
		},

		// Packages
		packageName: {
			type: 'text',
			placeholder: '10-Class Package',
			label: 'Package Name'
		},
		numberOfClasses: {
			type: 'text',
			label: 'Number of Classes',
			placeholder: 'Enter a number or "unlimited"'
		},
		category: {
			type: 'select',
			options: ['General', 'Senior', 'Beginner'],
			label: 'Category'
		},
		classType: {
			type: 'select',
			options: ['General', 'Special'],
			label: 'Class Type'
		},

		// Customer
		dateOfBirth: {
			type: 'date',
			label: 'Date of Birth'
		},

		// Dates
		startDate: {
			type: 'date',
			label: 'Start Date'
		},
		endDate: {
			type: 'date',
			label: 'End Date'
		},
		validityStartDate: {
			type: 'date',
			label: 'Validity Start Date'
		},
		validityEndDate: {
			type: 'date',
			label: 'Validity End Date'
		},
		attendanceDate: {
			type: 'date',
			label: 'Attendance Date'
		},

		// Times
		classTime: {
			type: 'time',
			label: 'Class Time'
		},
		attendanceTime: {
			type: 'time',
			label: 'Attendance Time'
		},
		paymentDateTime: {
			type: 'datetime-local',
			label: 'Payment Date & Time'
		},

		// Class scheduling
		className: {
			type: 'text',
			placeholder: 'e.g., Morning Yoga',
			label: 'Class Name',
			required: true
		},
		dayOfWeek: {
			type: 'select',
			options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
			label: 'Day of Week'
		},
		daysOfWeek: {
			type: 'checkboxGroup',
			options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
			label: 'Days of Week',
			required: true
		},
		startTime: {
			type: 'time',
			label: 'Start Time',
			required: true
		},
		duration: {
			type: 'select',
			options: ['Short (60 min)', 'Standard (75 min)', 'Long (90 min)'],
			valueMap: { 'Short (60 min)': 'Short', 'Standard (75 min)': 'Standard', 'Long (90 min)': 'Long' },
			label: 'Duration',
			required: true
		},
		defaultInstructorId: {
			type: 'text',
			placeholder: 'e.g., I00001 (optional)',
			label: 'Default Instructor ID'
		},
		maxCapacity: {
			type: 'number',
			placeholder: '20',
			label: 'Max Capacity',
			min: '1'
		},
		negativeBalanceOverride: {
			type: 'select',
			options: ['false', 'true'],
			label: 'Allow Negative Balance'
		},

		// Payment
		paymentMode: {
			type: 'select',
			options: ['cash', 'credit_card', 'debit_card', 'check'],
			label: 'Payment Mode'
		},
		status: {
			type: 'select',
			options: ['scheduled', 'pending', 'completed', 'cancelled'],
			label: 'Status'
		},
		notes: {
			type: 'textarea',
			placeholder: 'Optional notes',
			label: 'Notes'
		},
	};

	return configs[fieldName] || {
		type: 'text',
		label: fieldName
	};
}

// Generates the HTML markup for a single form field
function renderFieldInput(fieldName, config) {
	const type = config.type;
	const options = config.options;
	const placeholder = config.placeholder;
	const label = config.label;
	const required = config.required;
	const requiredAttr = required ? 'required' : '';

	// Build HTML attributes from remaining config properties
	const attrsStr = Object.entries(config)
		.filter(entry => {
			const key = entry[0];
			const value = entry[1];
			// Skip known fields and null values
			return !['type', 'options', 'placeholder', 'label', 'required'].includes(key) && value != null;
		})
		.map(entry => {
			const key = entry[0];
			const value = entry[1];
			return `${key}="${value}"`;
		})
		.join(' ');

	if (type === 'select') {
		const valueMap = config.valueMap || {};
		const optionsHtml = options
			.map(opt => {
				const val = valueMap[opt] !== undefined ? valueMap[opt] : opt;
				return `<option value="${val}">${opt}</option>`;
			})
			.join('');
		return `
      <div class="form-group">
        <label for="${fieldName}">${label}:</label>
        <select id="${fieldName}" name="${fieldName}" ${requiredAttr}>
          <option value="">-- Select --</option>
          ${optionsHtml}
        </select>
      </div>
    `;
	}

	if (type === 'checkboxGroup') {
		const checkboxes = options
			.map(opt => `
        <label class="checkbox-group-item">
          <input type="checkbox" name="${fieldName}" value="${opt}"> ${opt}
        </label>`)
			.join('');
		return `
      <div class="form-group">
        <label>${label}${required ? ' <span class="required-star">*</span>' : ''}:</label>
        <div class="checkbox-group-options">${checkboxes}</div>
      </div>
    `;
	}

	if (type === 'textarea') {
		return `
    <div class="form-group">
      <label for="${fieldName}">${label}:</label>
      <textarea
        id="${fieldName}"
        name="${fieldName}"
        ${placeholder ? `placeholder="${placeholder}"` : ''}
        ${requiredAttr}
      ></textarea>
    </div>
  `;
	}

	return `
    <div class="form-group">
      <label for="${fieldName}">${label}:</label>
      <input 
        type="${type}" 
        id="${fieldName}" 
        name="${fieldName}" 
        ${placeholder ? `placeholder="${placeholder}"` : ''}
        ${requiredAttr}
        ${attrsStr}
      />
    </div>
  `;
}

// Renders a linked list of available API methods for a module
function renderMethodList(baseUrl, methods, moduleTitle) {
	const methodLinks = methods
		.map(method => `<li><a href="${baseUrl}/${method}">${method}</a></li>`)
		.join("");

	return renderTemplate('methodList', {
		moduleTitle,
		methodLinks
	});
}

// Renders a complete HTML form for a given API method
function renderForm(methodName, baseUrl, fields, moduleTitle) {
	const fieldInputs = fields
		.map(field => renderFieldInput(field, getFieldConfig(field)))
		.join("");

	// Determine button text based on method name
	let submitText = 'Submit';
	if (methodName.startsWith('delete')) {
		submitText = 'Delete';
	} else if (methodName.startsWith('update')) {
		submitText = 'Update';
	} else if (methodName.startsWith('get')) {
		submitText = 'Retrieve';
	}

	return renderTemplate('form', {
		methodName,
		moduleTitle,
		action: `${baseUrl}/${methodName}`,
		baseUrl,
		fieldInputs: `<input type="hidden" name="_browserForm" value="1">${fieldInputs}`,
		submitText
	});
}

module.exports = {
	getFieldConfig,
	renderFieldInput,
	renderMethodList,
	renderForm
};
