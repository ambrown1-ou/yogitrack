const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { renderTemplate } = require("../api_helpers/templateEngine");
const { getConnectionCode } = require("../api_helpers/dbStatus");
const { escapeHtml } = require("../api_helpers/routeFactory");

// GET / - Render the API landing page with DB status, collection record counts, and module links
router.get("/", async(req, res) => {
	// Check current MongoDB connection state
	const code = getConnectionCode();
	const statusTextMap = {
		0: 'Disconnected',
		1: 'Connected',
		2: 'Connecting',
		3: 'Disconnecting'
	};
	const statusText = statusTextMap[code] || 'Unknown';
	const dbBadgeClass = code === 1 ? 'status-badge status-connected' : 'status-badge status-disconnected';
	const dbName = mongoose.connection.name || 'not connected';
	const dbStatus = `<span class="${dbBadgeClass}">${statusText}</span> <span class="api-status-dbname">${escapeHtml(dbName)}</span>`;

	// Check if user is logged in
	const isLoggedIn = req.session?.username ? true : false;
	const loginUser = isLoggedIn
		 ? `${escapeHtml(req.session.username)} (${escapeHtml(req.session.role || 'unknown role')})`
		 : 'Not logged in';
	const logoutLink = isLoggedIn
		 ? `<form method="POST" action="/api/user/logout" style="display:inline"><input type="hidden" name="_browserForm" value="1"><button type="submit" class="link-button">Logout</button></form>`
		 : '';
	const loginBadgeClass = isLoggedIn ? 'status-badge status-connected' : 'status-badge status-offline';
	const loginStatus = `<span class="${loginBadgeClass}">${loginUser}</span> ${logoutLink}`;

	// Build module list for the landing page table
	const modules = [
    {
			name: "User",
			path: "/api/user",
			collection: "users",
			description: "Register, login, and manage authenticated session"
		}, {
			name: "Instructor",
			path: "/api/instructor",
			collection: "instructors",
			description: "Manage yoga instructors"
		}, {
			name: "Customer",
			path: "/api/customer",
			collection: "customers",
			description: "Manage customers"
		}, {
			name: "Package",
			path: "/api/package",
			collection: "packages",
			description: "Manage class packages"
		}, {
			name: "Sale",
			path: "/api/sale",
			collection: "sales",
			description: "Manage package purchases and payments"
		}, {
			name: "Class",
			path: "/api/class",
			collection: "classseries",
			description: "Manage class schedule (series and instances)"
		}, {
			name: "Attendance",
			path: "/api/attendance",
			collection: "attendances",
			description: "Record and manage class attendance"
		}
	];

	const moduleLinks = modules
		.map(module => {
			return `<a class="module-card" href="${module.path}">
      <strong>${module.name}</strong>
      <span>${module.description}</span>
    </a>`;
		})
		.join("");

	const html = renderTemplate('apiIndex', {
		moduleLinks,
		dbStatus,
		loginStatus
	});

	res.send(html);
});

module.exports = router;

// ── API Reference Field Definitions ────────────────────────────────────────
// Metadata (type, format hint, valid values) for every parameter used across
// all modules. Looked up by field name when rendering the reference page.
const FIELD_DEFS = {
  username:                { type: 'string',  format: '3–50 characters' },
  password:                { type: 'string',  format: '6–128 characters' },
  newPassword:             { type: 'string',  format: '6–128 characters' },
  confirmPassword:         { type: 'string',  format: 'Must match newPassword' },
  role:                    { type: 'enum',    values: ['manager', 'instructor', 'customer'] },
  email:                   { type: 'string',  format: 'Valid email address' },
  instructorId:            { type: 'string',  format: 'I00001' },
  firstName:               { type: 'string',  format: 'Max 100 characters' },
  lastName:                { type: 'string',  format: 'Max 100 characters' },
  phone:                   { type: 'string',  format: 'Min 10 digits' },
  preferredContactMethod:  { type: 'enum',    values: ['email', 'phone'] },
  confirmDuplicate:        { type: 'boolean', format: "Send 'true' to bypass" },
  customerId:              { type: 'string',  format: 'C00001' },
  address:                 { type: 'string',  format: 'Max 300 characters' },
  dateOfBirth:             { type: 'date',    format: 'YYYY-MM-DD' },
  partialMatch:            { type: 'boolean', format: "Send 'true' to enable" },
  packageId:               { type: 'string',  format: 'P00001' },
  packageName:             { type: 'string',  format: 'Max 150 characters' },
  category:                { type: 'enum',    values: ['General', 'Senior', 'Beginner'] },
  numberOfClasses:         { type: 'number',  format: "Positive integer or 'unlimited'" },
  startDate:               { type: 'date',    format: 'YYYY-MM-DD' },
  endDate:                 { type: 'date',    format: 'YYYY-MM-DD' },
  price:                   { type: 'number',  format: 'Decimal ≥ 0' },
  saleId:                  { type: 'string',  format: 'S00001' },
  amountPaid:              { type: 'number',  format: 'Decimal ≥ 0' },
  paymentMode:             { type: 'enum',    values: ['cash', 'credit_card', 'debit_card', 'check'] },
  paymentDateTime:         { type: 'date',    format: 'YYYY-MM-DDTHH:MM' },
  validityStartDate:       { type: 'date',    format: 'YYYY-MM-DD' },
  validityEndDate:         { type: 'date',    format: 'YYYY-MM-DD' },
  notes:                   { type: 'string',  format: 'Max 1000 characters' },
  classId:                 { type: 'string',  format: 'CL00001' },
  className:               { type: 'string',  format: 'Max 150 characters' },
  classType:               { type: 'enum',    values: ['General', 'Special'] },
  daysOfWeek:              { type: 'array',   values: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
  startTime:               { type: 'string',  format: 'HH:MM (24-hour)' },
  duration:                { type: 'enum',    values: ['Short', 'Standard', 'Long'] },
  defaultInstructorId:     { type: 'string',  format: 'I00001' },
  maxCapacity:             { type: 'number',  format: 'Integer ≥ 1' },
  payRate:                 { type: 'number',  format: 'Decimal ≥ 0' },
  instanceId:              { type: 'string',  format: 'CI00001' },
  instructorId:            { type: 'string',  format: 'I00001' },
  status:                  { type: 'enum',    values: ['scheduled', 'cancelled', 'completed'] },
  attendanceId:            { type: 'string',  format: 'A00001' },
  attendanceDate:          { type: 'date',    format: 'YYYY-MM-DD' },
  attendanceTime:          { type: 'string',  format: 'HH:MM (24-hour)' },
  negativeBalanceOverride: { type: 'boolean', format: "Send 'true' to allow negative balance" },
};

// ── API Reference Data ──────────────────────────────────────────────────────
// Central source of truth for the /api/reference documentation page.
// Mirrors the `methods` config from each api_items/*.js file.
const REFERENCE_MODULES = [
  {
    name: 'User', path: '/api/user',
    description: 'Register, login, and manage authenticated sessions.',
    methods: [
      { name: 'register',        fields: ['username', 'password', 'role', 'email'],    required: ['username', 'password', 'role'] },
      { name: 'login',           fields: ['username', 'password'],                      required: ['username', 'password'] },
      { name: 'getCurrentUser',  fields: [],                                             required: [] },
      { name: 'getAllUsers',     fields: [],                                             required: [] },
      { name: 'changePassword',  fields: ['newPassword', 'confirmPassword'],            required: ['newPassword'] },
      { name: 'resetPassword',   fields: ['username'],                                   required: ['username'] },
      { name: 'logout',          fields: [],                                             required: [] },
    ]
  },
  {
    name: 'Instructor', path: '/api/instructor',
    description: 'Create and manage yoga instructor records.',
    methods: [
      { name: 'addInstructor',    fields: ['firstName', 'lastName', 'email', 'phone', 'preferredContactMethod', 'username', 'confirmDuplicate'], required: ['firstName', 'lastName', 'email'] },
      { name: 'getInstructor',    fields: ['instructorId'],                                                                                       required: ['instructorId'] },
      { name: 'getAllInstructors', fields: [],                                                                                                     required: [] },
      { name: 'updateInstructor', fields: ['instructorId', 'firstName', 'lastName', 'email', 'phone', 'preferredContactMethod', 'confirmDuplicate'], required: ['instructorId'] },
      { name: 'deleteInstructor', fields: ['instructorId'],                                                                                       required: ['instructorId'] },
    ]
  },
  {
    name: 'Customer', path: '/api/customer',
    description: 'Create and manage customer records.',
    methods: [
      { name: 'addCustomer',      fields: ['firstName', 'lastName', 'address', 'phone', 'email', 'preferredContactMethod', 'dateOfBirth'], required: ['firstName', 'lastName'] },
      { name: 'getCustomerById',  fields: ['customerId'],                                                                                   required: ['customerId'] },
      { name: 'getCustomerByName', fields: ['firstName', 'lastName', 'partialMatch'],                                                       required: [] },
      { name: 'getAllCustomers',  fields: [],                                                                                                required: [] },
      { name: 'updateCustomer',   fields: ['customerId', 'firstName', 'lastName', 'address', 'phone', 'email', 'preferredContactMethod', 'dateOfBirth', 'confirmDuplicate'], required: ['customerId'] },
      { name: 'deleteCustomer',   fields: ['customerId'],                                                                                   required: ['customerId'] },
    ]
  },
  {
    name: 'Package', path: '/api/package',
    description: 'Define class packages available for purchase.',
    methods: [
      { name: 'addPackage',    fields: ['packageName', 'category', 'numberOfClasses', 'startDate', 'endDate', 'price'], required: ['packageName', 'category', 'numberOfClasses', 'price'] },
      { name: 'getPackage',    fields: ['packageId'],                                                                    required: ['packageId'] },
      { name: 'getAllPackages', fields: [],                                                                               required: [] },
      { name: 'updatePackage', fields: ['packageId', 'packageName', 'category', 'numberOfClasses', 'startDate', 'endDate', 'price'], required: ['packageId'] },
      { name: 'deletePackage', fields: ['packageId'],                                                                    required: ['packageId'] },
    ]
  },
  {
    name: 'Sale', path: '/api/sale',
    description: 'Record package purchases and payment history.',
    methods: [
      { name: 'addSale',       fields: ['customerId', 'packageId', 'amountPaid', 'paymentMode', 'paymentDateTime', 'validityStartDate', 'validityEndDate', 'notes'], required: ['customerId', 'packageId', 'amountPaid', 'paymentMode'] },
      { name: 'getSale',       fields: ['saleId'],     required: ['saleId'] },
      { name: 'getByCustomer', fields: ['customerId'], required: ['customerId'] },
      { name: 'getAllSales',   fields: [],              required: [] },
      { name: 'deleteSale',    fields: ['saleId'],     required: ['saleId'] },
    ]
  },
  {
    name: 'Class', path: '/api/class',
    description: 'Manage class series definitions and individual class instances.',
    methods: [
      { name: 'addClassSeries',     fields: ['className', 'classType', 'startDate', 'endDate', 'daysOfWeek', 'startTime', 'duration', 'defaultInstructorId', 'maxCapacity', 'payRate'], required: ['className', 'classType', 'startDate', 'endDate', 'daysOfWeek', 'startTime', 'duration', 'payRate'] },
      { name: 'getClassSeries',     fields: ['classId'],                                                                                                                                 required: ['classId'] },
      { name: 'getAllClassSeries',  fields: [],                                                                                                                                           required: [] },
      { name: 'updateClassSeries',  fields: ['classId', 'className', 'classType', 'maxCapacity', 'payRate', 'defaultInstructorId', 'endDate'],                                          required: ['classId'] },
      { name: 'deleteClassSeries',  fields: ['classId'],                                                                                                                                 required: ['classId'] },
      { name: 'getClassInstances',  fields: ['classId', 'startDate', 'endDate'],                                                                                                         required: ['classId'] },
      { name: 'updateClassInstance', fields: ['instanceId', 'instructorId', 'startTime', 'duration', 'status', 'notes'],                                                                required: ['instanceId'] },
      { name: 'cancelClassInstance', fields: ['instanceId'],                                                                                                                             required: ['instanceId'] },
    ]
  },
  {
    name: 'Attendance', path: '/api/attendance',
    description: 'Record and query student attendance at class instances.',
    methods: [
      { name: 'recordAttendance', fields: ['instanceId', 'customerId', 'attendanceDate', 'attendanceTime', 'saleId', 'negativeBalanceOverride', 'notes'], required: ['instanceId', 'customerId', 'attendanceDate'] },
      { name: 'getAttendance',    fields: ['attendanceId'], required: ['attendanceId'] },
      { name: 'getByClass',       fields: ['instanceId'],   required: ['instanceId'] },
      { name: 'getByCustomer',    fields: ['customerId'],   required: ['customerId'] },
      { name: 'getAllAttendance', fields: [],                required: [] },
      { name: 'deleteAttendance', fields: ['attendanceId'], required: ['attendanceId'] },
    ]
  },
];

// GET /reference - Render the full API reference documentation page
router.get("/reference", (req, res) => {
  const referenceHtml = REFERENCE_MODULES.map(mod => {
    const methodsHtml = mod.methods.map(method => {
      const hasParams = method.fields.length > 0;
      const paramsHtml = hasParams
        ? `<table class="ref-params-table">
            <thead><tr><th>Parameter</th><th>Type</th><th>Format / Values</th><th>Status</th></tr></thead>
            <tbody>
              ${method.fields.map(fieldName => {
                const isRequired = method.required && method.required.includes(fieldName);
                const badge = isRequired
                  ? `<span class="ref-badge ref-badge-required">Required</span>`
                  : `<span class="ref-badge ref-badge-optional">Optional</span>`;
                const def = FIELD_DEFS[fieldName] || {};
                const typeLabel = def.type || '—';
                let detailCell = '—';
                if (def.values && def.values.length) {
                  detailCell = def.values.map(v => `<code class="ref-value">${escapeHtml(v)}</code>`).join(' ');
                } else if (def.format) {
                  detailCell = `<span class="ref-format">${escapeHtml(def.format)}</span>`;
                }
                return `<tr><td><code>${escapeHtml(fieldName)}</code></td><td><span class="ref-type ref-type-${escapeHtml(typeLabel)}">${escapeHtml(typeLabel)}</span></td><td>${detailCell}</td><td>${badge}</td></tr>`;
              }).join('')}
            </tbody>
          </table>`
        : `<p class="ref-no-params">No parameters</p>`;

      return `<div class="ref-method">
        <div class="ref-method-header">
          <code class="ref-endpoint"><span class="ref-verb">POST</span> ${escapeHtml(mod.path)}/${escapeHtml(method.name)}</code>
          <a class="ref-test-link" href="${escapeHtml(mod.path)}/${escapeHtml(method.name)}">Test &rarr;</a>
        </div>
        ${paramsHtml}
      </div>`;
    }).join('');

    return `<div class="ref-module card">
      <div class="ref-module-header">
        <div>
          <h2>${escapeHtml(mod.name)}</h2>
          <p>${escapeHtml(mod.description)}</p>
        </div>
        <a class="ref-module-link" href="${escapeHtml(mod.path)}">Methods &rarr;</a>
      </div>
      <div class="ref-methods">${methodsHtml}</div>
    </div>`;
  }).join('');

  const html = renderTemplate('apiReference', { referenceHtml });
  res.send(html);
});