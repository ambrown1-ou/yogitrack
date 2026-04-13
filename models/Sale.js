const mongoose = require('mongoose');

// Sale Schema - purchased package instance for a specific customer
const saleSchema = new mongoose.Schema({
  saleId: {
    type: String,
    required: true,
    unique: true
  },
  customerId: {
    type: String,
    required: true
  },
  packageId: {
    type: String,
    required: true
  },
  // Snapshot of package details at time of purchase
  packageSnapshot: {
    packageName: String,
    category: String,
    numberOfClasses: Number,
    price: Number
  },
  amountPaid: {
    type: Number,
    required: true,
    min: [0, 'Amount paid cannot be negative']
  },
  classesAdded: {
    type: Number,
    required: true
  },
  paymentMode: {
    type: String,
    enum: ['cash', 'credit_card', 'debit_card', 'check'],
    required: true
  },
  paymentDateTime: {
    type: Date,
    default: Date.now
  },
  validityStartDate: {
    type: Date,
    required: true
  },
  validityEndDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'completed'
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for reporting queries
saleSchema.index({ customerId: 1 });
saleSchema.index({ paymentDateTime: 1 });

module.exports = mongoose.model('Sale', saleSchema);
