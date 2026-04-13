const { createRouter, sendError, sendSuccess } = require('../modules/routeFactory');
const Package = require('../models/Package');
const Sale = require('../models/Sale');
const { generateId } = require('../modules/idGenerator');

const BACK = '/api/package';

function validatePackage(data) {
  const errors = [];
  if (!data.packageName || typeof data.packageName !== 'string' || data.packageName.trim().length === 0)
    errors.push("Package name is required");
  if (!data.category || !['General', 'Senior', 'Beginner'].includes(data.category))
    errors.push("Category must be 'General', 'Senior', or 'Beginner'");
  if (!data.numberOfClasses || (String(data.numberOfClasses) !== 'unlimited' && (!Number.isInteger(Number(data.numberOfClasses)) || Number(data.numberOfClasses) < 1)))
    errors.push("Number of classes must be a positive whole number or 'unlimited'");
  if (!data.startDate || isNaN(Date.parse(data.startDate)))
    errors.push("Valid start date is required");
  if (!data.endDate || isNaN(Date.parse(data.endDate)))
    errors.push("Valid end date is required");
  if (new Date(data.startDate) >= new Date(data.endDate))
    errors.push("End date must be after start date");
  if (String(data.numberOfClasses) !== 'unlimited' && data.startDate && data.endDate && !isNaN(Date.parse(data.startDate)) && !isNaN(Date.parse(data.endDate))) {
    const days = Math.floor((new Date(data.endDate) - new Date(data.startDate)) / (1000 * 60 * 60 * 24));
    if (Number(data.numberOfClasses) > days)
      errors.push(`Number of classes (${data.numberOfClasses}) cannot exceed the number of days in the validity period (${days})`);
  }
  if (!data.price || isNaN(parseFloat(data.price)) || parseFloat(data.price) < 0)
    errors.push("Price must be a valid positive number");
  return errors;
}

function serialize(doc) {
  return {
    packageId: doc.packageId,
    packageName: doc.packageName,
    category: doc.category,
    numberOfClasses: doc.numberOfClasses === -1 ? 'unlimited' : doc.numberOfClasses,
    startDate: doc.startDate instanceof Date ? doc.startDate.toISOString().split('T')[0] : doc.startDate,
    endDate: doc.endDate instanceof Date ? doc.endDate.toISOString().split('T')[0] : doc.endDate,
    price: doc.price,
    isActive: doc.isActive
  };
}

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
      try {
        const { packageName, category, numberOfClasses, startDate, endDate, price } = req.body;
        const errors = validatePackage(req.body);
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
        sendSuccess(res, 'Package Added Successfully', serialize(doc.toObject()), BACK);
      } catch (err) {
        console.error('Add package error:', err);
        sendError(res, 500, 'Error Adding Package', err.message, BACK);
      }
    },

    async getPackage(req, res) {
      try {
        const { packageId } = req.body;
        if (!packageId || typeof packageId !== 'string' || !packageId.trim())
          return sendError(res, 400, 'Error: Required Fields Missing', 'packageId is required', BACK);

        const doc = await Package.findOne({ packageId: packageId.trim() }).lean();
        if (!doc) return sendError(res, 404, 'Package Not Found', `No package found with ID: ${packageId}`, BACK);

        sendSuccess(res, 'Package Retrieved', serialize(doc), BACK);
      } catch (err) {
        console.error('Get package error:', err);
        sendError(res, 500, 'Error Retrieving Package', err.message, BACK);
      }
    },

    async getAll(req, res) {
      try {
        const docs = await Package.find({}).lean();
        sendSuccess(res, `Retrieved ${docs.length} Packages`, docs.map(serialize), BACK);
      } catch (err) {
        console.error('Get all packages error:', err);
        sendError(res, 500, 'Error Retrieving Packages', err.message, BACK);
      }
    },

    async updatePackage(req, res) {
      try {
        const { packageId, packageName, category, numberOfClasses, startDate, endDate, price } = req.body;
        if (!packageId || typeof packageId !== 'string' || !packageId.trim())
          return sendError(res, 400, 'Error: Required Fields Missing', 'packageId is required', BACK);

        const errors = validatePackage(req.body);
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
        sendSuccess(res, 'Package Updated Successfully', serialize(doc.toObject()), BACK);
      } catch (err) {
        console.error('Update package error:', err);
        sendError(res, 500, 'Error Updating Package', err.message, BACK);
      }
    },

    async deletePackage(req, res) {
      try {
        const { packageId } = req.body;
        if (!packageId || typeof packageId !== 'string' || !packageId.trim())
          return sendError(res, 400, 'Error: Required Fields Missing', 'packageId is required', BACK);

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
      } catch (err) {
        console.error('Delete package error:', err);
        sendError(res, 500, 'Error Deleting Package', err.message, BACK);
      }
    }
  }
});
