// Helper module for form rendering in API routes
const { renderTemplate } = require('./templateEngine');

// Returns input type, label, and attributes for a given field name
function getFieldConfig(fieldName) {
  const configs = {
    // IDs
    instructorId: { type: 'text', placeholder: 'e.g., I00001', label: 'Instructor ID' },
    customerId: { type: 'text', placeholder: 'e.g., C00001', label: 'Customer ID' },
    classId: { type: 'text', placeholder: 'e.g., CL0001', label: 'Class ID' },
    packageId: { type: 'text', placeholder: 'e.g., P00001', label: 'Package ID' },
    saleId: { type: 'text', placeholder: 'e.g., S00001', label: 'Sale ID' },
    attendanceId: { type: 'text', placeholder: 'e.g., A20260411001', label: 'Attendance ID' },

    // Names
    firstName: { type: 'text', placeholder: 'John', label: 'First Name', required: true },
    lastName: { type: 'text', placeholder: 'Doe', label: 'Last Name', required: true },
    username: { type: 'text', placeholder: 'manager01', label: 'Username', required: true },
    password: { type: 'password', placeholder: 'Enter password', label: 'Password', required: true },
    role: { type: 'select', options: ['manager', 'instructor'], label: 'Role', required: true },

    // Contact
    email: { type: 'email', placeholder: 'john@example.com', label: 'Email', required: true },
    phone: { type: 'tel', placeholder: '(412) 555-0123', label: 'Phone', required: false },
    preferredContactMethod: { type: 'select', options: ['email', 'phone'], label: 'Preferred Contact Method' },

    // Address
    address: { type: 'text', placeholder: '123 Main St, City, State 12345', label: 'Address' },

    // Financial
    price: { type: 'number', step: '0.01', placeholder: '0.00', label: 'Price', min: '0' },
    payRate: { type: 'number', step: '0.01', placeholder: '0.00', label: 'Pay Rate', min: '0' },
    amountPaid: { type: 'number', step: '0.01', placeholder: '0.00', label: 'Amount Paid', min: '0' },
    classBalance: { type: 'number', placeholder: '0', label: 'Class Balance' },

    // Packages
    packageName: { type: 'text', placeholder: '10-Class Package', label: 'Package Name' },
    numberOfClasses: { type: 'text', label: 'Number of Classes', placeholder: 'Enter a number or "unlimited"' },
    category: { type: 'select', options: ['General', 'Senior', 'Beginner'], label: 'Category' },
    classType: { type: 'select', options: ['General', 'Special'], label: 'Class Type' },

    // Customer
    dateOfBirth: { type: 'date', label: 'Date of Birth' },

    // Dates
    startDate: { type: 'date', label: 'Start Date' },
    endDate: { type: 'date', label: 'End Date' },
    validityStartDate: { type: 'date', label: 'Validity Start Date' },
    validityEndDate: { type: 'date', label: 'Validity End Date' },
    attendanceDate: { type: 'date', label: 'Attendance Date' },

    // Times
    classTime: { type: 'time', label: 'Class Time' },
    attendanceTime: { type: 'time', label: 'Attendance Time' },
    paymentDateTime: { type: 'datetime-local', label: 'Payment Date & Time' },

    // Class scheduling
    dayOfWeek: { type: 'select', options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], label: 'Day of Week' },

    // Payment
    paymentMode: { type: 'select', options: ['cash', 'credit_card', 'debit_card', 'check'], label: 'Payment Mode' },
    status: { type: 'select', options: ['pending', 'completed', 'cancelled'], label: 'Status' },
    notes: { type: 'text', placeholder: 'Optional notes', label: 'Notes' },
  };

  return configs[fieldName] || { type: 'text', label: fieldName };
}

// Generates the HTML markup for a single form field
function renderFieldInput(fieldName, config) {
  const { type, options, placeholder, label, required, ...attrs } = config;
  const requiredAttr = required ? 'required' : '';
  const attrsStr = Object.entries(attrs)
    .filter(([, v]) => v != null)
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ');

  if (type === 'select') {
    const optionsHtml = options
      .map(opt => `<option value="${opt}">${opt}</option>`)
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

  const submitText = methodName.startsWith('delete') ? 'Delete' : 
                     methodName.startsWith('update') ? 'Update' :
                     methodName.startsWith('get') ? 'Retrieve' : 'Submit';

  return renderTemplate('form', {
    methodName,
    action: `${baseUrl}/${methodName}`,
    baseUrl,
    fieldInputs,
    submitText
  });
}

module.exports = {
  getFieldConfig,
  renderFieldInput,
  renderMethodList,
  renderForm
};
