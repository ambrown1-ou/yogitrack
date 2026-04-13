const { createRouter, sendError, sendSuccess, sendConfirmation } = require('../modules/routeFactory');
const Customer = require('../models/Customer');
const Sale = require('../models/Sale');
const Attendance = require('../models/Attendance');
const { generateId } = require('../modules/idGenerator');

const BACK = '/api/customer';

// Validates required fields, email format, phone length, and contact method
function validateCustomer(data) {
  const errors = [];
  if (!data.firstName || typeof data.firstName !== 'string' || data.firstName.trim().length === 0)
    errors.push("First name is required");
  if (!data.lastName || typeof data.lastName !== 'string' || data.lastName.trim().length === 0)
    errors.push("Last name is required");
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    errors.push("Email must be valid");
  if (data.phone && !/^\d{10,}$/.test(data.phone.replace(/\D/g, '')))
    errors.push("Phone must contain at least 10 digits");
  if (data.preferredContactMethod && !['email', 'phone'].includes(data.preferredContactMethod))
    errors.push("Preferred contact method must be 'email' or 'phone'");
  return errors;
}

// Converts a Mongoose document to a plain object with formatted dates
function serialize(doc) {
  return {
    customerId: doc.customerId,
    firstName: doc.firstName,
    lastName: doc.lastName,
    email: doc.email,
    phone: doc.phone,
    address: doc.address,
    dateOfBirth: doc.dateOfBirth instanceof Date ? doc.dateOfBirth.toISOString().split('T')[0] : doc.dateOfBirth,
    preferredContactMethod: doc.preferredContactMethod,
    classBalance: doc.classBalance,
    joinDate: doc.joinDate instanceof Date ? doc.joinDate.toISOString().split('T')[0] : doc.joinDate,
    isActive: doc.isActive
  };
}

// Route handlers for customer management
module.exports = createRouter({
  moduleTitle: 'Customer',
  basePath: BACK,
  methods: {
    addCustomer:    { fields: ['firstName', 'lastName', 'address', 'phone', 'email', 'preferredContactMethod', 'dateOfBirth'] },
    getCustomerById:   { fields: ['customerId'], required: ['customerId'] },
    getCustomerByName: { fields: ['firstName', 'lastName'], required: ['lastName'] },
    getAll:            { fields: [] },
    updateCustomer: { fields: ['customerId', 'firstName', 'lastName', 'address', 'phone', 'email', 'preferredContactMethod', 'dateOfBirth'], required: ['customerId'] },
    deleteCustomer: { fields: ['customerId'], required: ['customerId'] },
  },
  handlers: {
    // Creates a new customer with duplicate name detection; prompts for confirmation if a match exists
    async addCustomer(req, res) {
      try {
        const { firstName, lastName, address, phone, email, preferredContactMethod, dateOfBirth, confirmDuplicate } = req.body;
        const errors = validateCustomer(req.body);
        if (errors.length) return sendError(res, 400, 'Validation Failed', errors.join('; '), BACK);

        // Duplicate name warning - allow proceed with confirmation
        if (confirmDuplicate !== 'true') {
          const existing = await Customer.findOne({ firstName: firstName.trim(), lastName: lastName.trim() }).lean();
          if (existing) {
            return sendConfirmation(res, {
              message: 'Duplicate Customer Name Found',
              details: `A customer named "${firstName.trim()} ${lastName.trim()}" already exists (ID: ${existing.customerId}). Do you want to add another customer with the same name?`,
              action: `${BACK}/addCustomer`,
              formData: req.body,
              extraFields: { confirmDuplicate: 'true' },
              confirmText: 'Yes, Add Customer',
              backUrl: BACK
            });
          }
        }

        // Create new customer
        const customerId = await generateId('customer');

        // Trim string fields and handle optional fields
        const doc = new Customer({
          customerId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          address: address ? address.trim() : '',
          phone: phone ? phone.trim() : '',
          email: email ? email.trim() : '',
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          preferredContactMethod: preferredContactMethod || 'email',
          isActive: true,
          classBalance: 0
        });
        await doc.save();
        sendSuccess(res, 'Customer Added Successfully', serialize(doc.toObject()), BACK);
      } catch (err) {
        console.error('Add customer error:', err);
        sendError(res, 500, 'Error Adding Customer', err.message, BACK);
      }
    },

    // Retrieves a single customer by customerId
    async getCustomerById(req, res) {
      try {
        const { customerId } = req.body;
        if (!customerId || typeof customerId !== 'string' || !customerId.trim())
          return sendError(res, 400, 'Error: Required Fields Missing', 'customerId is required', BACK);

        const doc = await Customer.findOne({ customerId: customerId.trim() }).lean();
        if (!doc) return sendError(res, 404, 'Customer Not Found', `No customer found with ID: ${customerId}`, BACK);

        sendSuccess(res, 'Customer Retrieved', serialize(doc), BACK);
      } catch (err) {
        console.error('Get customer by ID error:', err);
        sendError(res, 500, 'Error Retrieving Customer', err.message, BACK);
      }
    },

    // Retrieves customers by first and/or last name
    async getCustomerByName(req, res) {
      try {
        const { firstName, lastName } = req.body;
        if (!lastName || typeof lastName !== 'string' || !lastName.trim())
          return sendError(res, 400, 'Error: Required Fields Missing', 'lastName is required', BACK);

        const query = { lastName: lastName.trim() };
        if (firstName && typeof firstName === 'string' && firstName.trim())
          query.firstName = firstName.trim();

        const docs = await Customer.find(query).lean();
        if (!docs.length) return sendError(res, 404, 'Customer Not Found', `No customers found matching that name`, BACK);

        sendSuccess(res, `Found ${docs.length} Customer(s)`, docs.map(serialize), BACK);
      } catch (err) {
        console.error('Get customer by name error:', err);
        sendError(res, 500, 'Error Retrieving Customer', err.message, BACK);
      }
    },

    // Retrieves all customers
    async getAll(req, res) {
      try {
        const docs = await Customer.find({}).lean();
        sendSuccess(res, `Retrieved ${docs.length} Customers`, docs.map(serialize), BACK);
      } catch (err) {
        console.error('Get all customers error:', err);
        sendError(res, 500, 'Error Retrieving Customers', err.message, BACK);
      }
    },

    // Updates an existing customer's fields by customerId; only provided fields are changed
    async updateCustomer(req, res) {
      try {
        const { customerId, firstName, lastName, address, phone, email, preferredContactMethod, dateOfBirth } = req.body;
        if (!customerId || typeof customerId !== 'string' || !customerId.trim())
          return sendError(res, 400, 'Error: Required Fields Missing', 'customerId is required', BACK);

        const errors = validateCustomer(req.body);
        if (errors.length) return sendError(res, 400, 'Validation Failed', errors.join('; '), BACK);

        const doc = await Customer.findOne({ customerId: customerId.trim() });
        if (!doc) return sendError(res, 404, 'Customer Not Found', `No customer found with ID: ${customerId}`, BACK);

        if (firstName) doc.firstName = firstName.trim();
        if (lastName) doc.lastName = lastName.trim();
        if (address !== undefined) doc.address = address ? address.trim() : '';
        if (phone !== undefined) doc.phone = phone ? phone.trim() : '';
        if (email !== undefined) doc.email = email ? email.trim() : '';
        if (preferredContactMethod) doc.preferredContactMethod = preferredContactMethod;
        if (dateOfBirth !== undefined) doc.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : undefined;

        await doc.save();
        sendSuccess(res, 'Customer Updated Successfully', serialize(doc.toObject()), BACK);
      } catch (err) {
        console.error('Update customer error:', err);
        sendError(res, 500, 'Error Updating Customer', err.message, BACK);
      }
    },

    // Deletes a customer by customerId; soft-deletes (deactivates) if related sales or attendance exist
    async deleteCustomer(req, res) {
      try {
        const { customerId } = req.body;
        if (!customerId || typeof customerId !== 'string' || !customerId.trim())
          return sendError(res, 400, 'Error: Required Fields Missing', 'customerId is required', BACK);

        const doc = await Customer.findOne({ customerId: customerId.trim() });
        if (!doc) return sendError(res, 404, 'Customer Not Found', `No customer found with ID: ${customerId}`, BACK);

        // A5: Check for related sales or attendance records
        const relatedSales = await Sale.countDocuments({ customerId: customerId.trim() });
        const relatedAttendance = await Attendance.countDocuments({ customerId: customerId.trim() });

        if (relatedSales > 0 || relatedAttendance > 0) {
          // Soft delete - mark inactive instead of removing
          doc.isActive = false;
          await doc.save();
          return sendSuccess(res, 'Customer Deactivated',
            `Customer ${customerId.trim()} has ${relatedSales} sale(s) and ${relatedAttendance} attendance record(s). The customer has been marked inactive instead of deleted.`,
            BACK);
        }

        await Customer.deleteOne({ customerId: customerId.trim() });
        sendSuccess(res, 'Customer Deleted Successfully', { customerId: customerId.trim() }, BACK);
      } catch (err) {
        console.error('Delete customer error:', err);
        sendError(res, 500, 'Error Deleting Customer', err.message, BACK);
      }
    }
  }
});
