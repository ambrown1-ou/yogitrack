const { createRouter, sendError, sendSuccess, requireField } = require('../modules/routeFactory');
const Package = require('../models/Package');
const Sale = require('../models/Sale');
const { generateId } = require('../modules/idGenerator');

const BACK = '/api/package';

module.exports = createRouter({
  moduleTitle: 'Package',
  basePath: BACK,
  methods: {
    addPackage: { fields: ['packageName', 'category', 'numberOfClasses', 'startDate', 'endDate', 'price'] },
    getPackage: { fields: ['packageId'], required: ['packageId'] },
    getAll: { fields: [] },
    updatePackage: { fields: ['packageId', 'packageName', 'category', 'numberOfClasses', 'startDate', 'endDate', 'price'], required: ['packageId'] },
    deletePackage: { fields: ['packageId'], required: ['packageId'] },
  },
  handlers: {
    async addPackage(req, res) {
      const { packageName, category, numberOfClasses, startDate, endDate, price } = req.body;
      const errors = Package.validate(req.body);
      if (errors.length) return sendError(res, 400, 'Validation Failed', errors.join('; '), BACK);

      const packageId = await generateId('package');
      const doc = new Package({
        packageId,
        packageName: packageName.trim(),
        category,
        numberOfClasses: numberOfClasses === 'unlimited' ? -1 : parseInt(numberOfClasses),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        price: parseFloat(price),
        isActive: true
      });
      await doc.save();
      sendSuccess(res, 'Package Added Successfully', Package.serialize(doc.toObject()), BACK);
    },

    async getPackage(req, res) {
      const { packageId } = req.body;
      if (!requireField(res, packageId, 'packageId', BACK)) return;

      const doc = await Package.findOne({ packageId: packageId.trim() }).lean();
      if (!doc) return sendError(res, 404, 'Package Not Found', `No package found with ID: ${packageId}`, BACK);

      sendSuccess(res, 'Package Retrieved', Package.serialize(doc), BACK);
    },

    async getAll(req, res) {
      const docs = await Package.find({}).lean();
      sendSuccess(res, `Retrieved ${docs.length} Packages`, docs.map(Package.serialize.bind(Package)), BACK);
    },

    async updatePackage(req, res) {
      const { packageId, packageName, category, numberOfClasses, startDate, endDate, price } = req.body;
      if (!requireField(res, packageId, 'packageId', BACK)) return;

      const errors = Package.validate(req.body);
      if (errors.length) return sendError(res, 400, 'Validation Failed', errors.join('; '), BACK);

      const doc = await Package.findOne({ packageId: packageId.trim() });
      if (!doc) return sendError(res, 404, 'Package Not Found', `No package found with ID: ${packageId}`, BACK);

      doc.packageName = packageName.trim();
      doc.category = category;
      doc.numberOfClasses = numberOfClasses === 'unlimited' ? -1 : parseInt(numberOfClasses);
      doc.startDate = new Date(startDate);
      doc.endDate = new Date(endDate);
      doc.price = parseFloat(price);

      await doc.save();
      sendSuccess(res, 'Package Updated Successfully', Package.serialize(doc.toObject()), BACK);
    },

    async deletePackage(req, res) {
      const { packageId } = req.body;
      if (!requireField(res, packageId, 'packageId', BACK)) return;

      const doc = await Package.findOne({ packageId: packageId.trim() });
      if (!doc) return sendError(res, 404, 'Package Not Found', `No package found with ID: ${packageId}`, BACK);

      // A5: Check for related sales history
      const relatedSales = await Sale.countDocuments({ packageId: packageId.trim() });

      if (relatedSales > 0) {
        // Soft delete - mark inactive instead of removing
        doc.isActive = false;
        await doc.save();
        return sendSuccess(res, 'Package Deactivated',
          `Package ${packageId.trim()} has ${relatedSales} related sale(s). The package has been marked inactive instead of deleted.`,
          BACK);
      }

      await Package.deleteOne({ packageId: packageId.trim() });
      sendSuccess(res, 'Package Deleted Successfully', { packageId: packageId.trim() }, BACK);
    }
  }
});
