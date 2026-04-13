const { createRouter } = require('../modules/routeFactory');

// TODO: Replace these stubbed method definitions with Sale model handlers.
module.exports = createRouter({
  moduleTitle: 'Sale',
  basePath: '/api/sale',
  methods: {
    addSale: { fields: ['customerId', 'packageId', 'amountPaid', 'paymentMode', 'paymentDateTime', 'validityStartDate', 'validityEndDate', 'notes'], required: ['customerId', 'packageId', 'amountPaid', 'paymentMode'] },
    getSale: { fields: ['saleId'], required: ['saleId'] },
    getByCustomer: { fields: ['customerId'], required: ['customerId'] },
    getAll: { fields: [] },
    deleteSale: { fields: ['saleId'], required: ['saleId'] },
  }
});