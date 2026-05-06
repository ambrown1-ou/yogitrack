const { createRouter, sendError, sendSuccess } = require('../api_helpers/routeFactory');
const Attendance = require('../api_models/Attendance');
const { ClassInstance } = require('../api_models/Class');
const Customer = require('../api_models/Customer');
const { generateId } = require('../api_helpers/idGenerator');

const BACK = '/api/attendance';

module.exports = createRouter({
  moduleTitle: 'Attendance',
  basePath: BACK,
  methods: {
    recordAttendance: {
      fields: ['instanceId', 'customerId', 'attendanceDate', 'attendanceTime', 'saleId', 'negativeBalanceOverride', 'notes'],
      required: ['instanceId', 'customerId', 'attendanceDate']
    },
    getAttendance: { fields: ['attendanceId'], required: ['attendanceId'] },
    getByClass: { fields: ['instanceId'], required: ['instanceId'] },
    getByCustomer: { fields: ['customerId'], required: ['customerId'] },
    getAll: { fields: [] },
    deleteAttendance: { fields: ['attendanceId'], required: ['attendanceId'] },
  },
  handlers: {
    // Records attendance for a customer at a class instance; deducts one class from their balance
    async recordAttendance(req, res) {
      const { instanceId, customerId, attendanceDate, attendanceTime, saleId, notes } = req.body;
      const negativeBalanceOverride = req.body.negativeBalanceOverride === 'true';

      // Verify instance exists and is not cancelled
      const instance = await ClassInstance.findOne({ instanceId: instanceId.trim() }).lean();
      if (!instance)
        return sendError(res, 404, 'Instance Not Found', `No class instance found with ID: ${instanceId}`, BACK);
      if (instance.status === 'cancelled')
        return sendError(res, 400, 'Instance Cancelled', `Class instance ${instanceId} is cancelled and cannot accept attendance`, BACK);

      // Verify customer exists
      const customer = await Customer.findOne({ customerId: customerId.trim() });
      if (!customer)
        return sendError(res, 404, 'Customer Not Found', `No customer found with ID: ${customerId}`, BACK);

      const beforeBalance = customer.classBalance;
      let packageEntry = null;

      if (saleId) {
        // Find the specific package entry in the customer's packages array
        packageEntry = customer.packages.find(p => p.packageId === saleId.trim());
        if (!packageEntry)
          return sendError(res, 400, 'Package Not Found', `No active package found with saleId "${saleId}" on this customer`, BACK);

        // Unlimited packages don't require a balance check
        if (!packageEntry.unlimited) {
          if (packageEntry.classBalance <= 0 && !negativeBalanceOverride)
            return sendError(res, 400, 'Insufficient Package Balance', `Package "${saleId}" has no remaining classes. Set negativeBalanceOverride to proceed.`, BACK);
          packageEntry.classBalance -= 1;
        }
      }

      // Deduct from global balance regardless of whether a saleId was used
      const newBalance = beforeBalance - 1;
      if (newBalance < 0 && !negativeBalanceOverride)
        return sendError(res, 400, 'Insufficient Class Balance', `Customer has a balance of ${beforeBalance}. Set negativeBalanceOverride to proceed.`, BACK);

      customer.classBalance = newBalance;
      await customer.save();

      const attendanceId = await generateId('attendance');
      const record = new Attendance({
        attendanceId,
        instanceId: instanceId.trim(),
        instructorId: instance.instructorId,
        customerId: customerId.trim(),
        attendanceDate: new Date(attendanceDate + 'T00:00:00Z'),
        attendanceTime: attendanceTime ? attendanceTime.trim() : undefined,
        saleId: saleId ? saleId.trim() : undefined,
        beforeBalance,
        afterBalance: newBalance,
        negativeBalanceOverride,
        notes: notes ? notes.trim() : undefined
      });
      await record.save();
      sendSuccess(res, 'Attendance Recorded', Attendance.serialize(record.toObject()), BACK);
    },

    // Retrieves a single attendance record by attendanceId
    async getAttendance(req, res) {
      const { attendanceId } = req.body;
      const record = await Attendance.findOne({ attendanceId: attendanceId.trim() }).lean();
      if (!record)
        return sendError(res, 404, 'Attendance Not Found', `No attendance record found with ID: ${attendanceId}`, BACK);
      sendSuccess(res, 'Attendance Retrieved', Attendance.serialize(record), BACK);
    },

    // Returns all attendance records for a given class instance
    async getByClass(req, res) {
      const { instanceId } = req.body;
      const records = await Attendance.find({ instanceId: instanceId.trim() }).lean();
      sendSuccess(res, `Retrieved ${records.length} Attendance Record(s)`, records.map(r => Attendance.serialize(r)), BACK);
    },

    // Returns all attendance records for a given customer
    async getByCustomer(req, res) {
      const { customerId } = req.body;
      const records = await Attendance.find({ customerId: customerId.trim() })
        .sort({ attendanceDate: -1 })
        .lean();
      sendSuccess(res, `Retrieved ${records.length} Attendance Record(s)`, records.map(r => Attendance.serialize(r)), BACK);
    },

    // Returns all attendance records
    async getAll(req, res) {
      const records = await Attendance.find({}).sort({ attendanceDate: -1 }).lean();
      sendSuccess(res, `Retrieved ${records.length} Attendance Record(s)`, records.map(r => Attendance.serialize(r)), BACK);
    },

    // Deletes an attendance record and reverses the balance deduction on the customer
    async deleteAttendance(req, res) {
      const { attendanceId } = req.body;

      const record = await Attendance.findOne({ attendanceId: attendanceId.trim() }).lean();
      if (!record)
        return sendError(res, 404, 'Attendance Not Found', `No attendance record found with ID: ${attendanceId}`, BACK);

      // Reverse balance deduction on the customer
      const customer = await Customer.findOne({ customerId: record.customerId });
      if (customer) {
        customer.classBalance += 1;

        // If a saleId was recorded, reverse the package balance too
        if (record.saleId) {
          const pkgEntry = customer.packages.find(p => p.packageId === record.saleId);
          if (pkgEntry && !pkgEntry.unlimited) {
            pkgEntry.classBalance += 1;
          }
        }
        await customer.save();
      }

      await Attendance.deleteOne({ attendanceId: attendanceId.trim() });
      sendSuccess(res, 'Attendance Record Deleted', { attendanceId, deleted: true }, BACK);
    }
  }
});