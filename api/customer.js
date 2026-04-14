const { createRouter, sendError, sendSuccess, sendConfirmation, requireField } = require('../modules/routeFactory');
const Customer = require('../models/Customer');
const Sale = require('../models/Sale');
const Attendance = require('../models/Attendance');
const { generateId } = require('../modules/idGenerator');

const BACK = '/api/customer';

// Route handlers for customer management
module.exports = createRouter({
  moduleTitle: 'Customer',
  basePath: BACK,
  methods: {
    addCustomer:    { fields: ['firstName', 'lastName', 'address', 'phone', 'email', 'preferredContactMethod', 'dateOfBirth'] },
    getCustomerById:   { fields: ['customerId'], required: ['customerId'] },
    getCustomerByName: { fields: ['firstName', 'lastName'], required: ['lastName'] },
    getAllCustomers:    { fields: [] },
    updateCustomer: { fields: ['customerId', 'firstName', 'lastName', 'address', 'phone', 'email', 'preferredContactMethod', 'dateOfBirth'], required: ['customerId'] },
    deleteCustomer: { fields: ['customerId'], required: ['customerId'] },
  },
  handlers: {
    // Creates a new customer with duplicate name detection; prompts for confirmation if a match exists
    async addCustomer(req, res) {
      const { firstName, lastName, address, phone, email, preferredContactMethod, dateOfBirth, confirmDuplicate } = req.body;
      const errors = Customer.validate(req.body);
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
      sendSuccess(res, 'Customer Added Successfully', Customer.serialize(doc.toObject()), BACK);
    },

    // Retrieves a single customer by customerId
    async getCustomerById(req, res) {
      const { customerId } = req.body;
      if (!requireField(res, customerId, 'customerId', BACK)) return;

      const doc = await Customer.findOne({ customerId: customerId.trim() }).lean();
      if (!doc) return sendError(res, 404, 'Customer Not Found', `No customer found with ID: ${customerId}`, BACK);

      sendSuccess(res, 'Customer Retrieved', Customer.serialize(doc), BACK);
    },

    // Retrieves customers by first and/or last name
    async getCustomerByName(req, res) {
      const { firstName, lastName } = req.body;
      if (!requireField(res, lastName, 'lastName', BACK)) return;

      const query = { lastName: lastName.trim() };
      if (firstName && typeof firstName === 'string' && firstName.trim())
        query.firstName = firstName.trim();

      const docs = await Customer.find(query).lean();
      if (!docs.length) return sendError(res, 404, 'Customer Not Found', `No customers found matching that name`, BACK);

      sendSuccess(res, `Found ${docs.length} Customer(s)`, docs.map(Customer.serialize.bind(Customer)), BACK);
    },

    // Retrieves all customers
    async getAllCustomers(req, res) {
      const docs = await Customer.find({}).lean();
      sendSuccess(res, `Retrieved ${docs.length} Customers`, docs.map(Customer.serialize.bind(Customer)), BACK);
    },

    // Updates an existing customer's fields by customerId; only provided fields are changed
    async updateCustomer(req, res) {
      const { customerId, firstName, lastName, address, phone, email, preferredContactMethod, dateOfBirth } = req.body;
      if (!requireField(res, customerId, 'customerId', BACK)) return;

      const errors = Customer.validate(req.body);
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
      sendSuccess(res, 'Customer Updated Successfully', Customer.serialize(doc.toObject()), BACK);
    },

    // Deletes a customer by customerId; soft-deletes (deactivates) if related sales or attendance exist
    async deleteCustomer(req, res) {
      const { customerId } = req.body;
      if (!requireField(res, customerId, 'customerId', BACK)) return;

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
    }
  }
});
