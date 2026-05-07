/* ID Generator Utility:
  Generates unique IDs for different entity types
  Format: PREFIX + 5-digit number (e.g., I00001, C00001, P00001, etc.)
  Uses an atomic counter collection to prevent race conditions.
 */

const mongoose = require('mongoose');
const Instructor = require('../api_models/Instructor');
const Customer = require('../api_models/Customer');
const Package = require('../api_models/Package');
const { ClassSeries, ClassInstance } = require('../api_models/Class');
const Sale = require('../api_models/Sale');
const Attendance = require('../api_models/Attendance');

const counterSchema = new mongoose.Schema({
  _id: String,
  seq: { type: Number, default: 0 }
});
const Counter = mongoose.model('Counter', counterSchema);

const ENTITY_CONFIG = {
  instructor: { prefix: 'I', model: Instructor, field: 'instructorId' },
  customer: { prefix: 'C', model: Customer, field: 'customerId' },
  package: { prefix: 'P', model: Package, field: 'packageId' },
  class: { prefix: 'CL', model: ClassSeries, field: 'classId' },
  instance: { prefix: 'CI', model: ClassInstance, field: 'instanceId' },
  sale: { prefix: 'S', model: Sale, field: 'saleId' },
  attendance: { prefix: 'A', model: Attendance, field: 'attendanceId' },
};

// Extracts the numeric portion from an entity ID
function extractNumber(id) {
  if (!id) return 0;
  const match = id.match(/\d+$/);
  return match ? parseInt(match[0]) : 0;
}

// Pads a number to 5 digits with leading zeros
function formatNumber(num) {
  return String(num).padStart(5, '0');
}

// increments counter and returns next ID in one operation
async function generateId(entityType) {
  const config = ENTITY_CONFIG[entityType];
  if (!config) throw new Error(`Unknown entity type: ${entityType}`);

  const counter = await Counter.findOneAndUpdate(
    { _id: entityType },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  );

  return config.prefix + formatNumber(counter.seq);
}

// Reserves `count` IDs in one atomic operation; returns an array of IDs
async function generateIds(entityType, count) {
  const config = ENTITY_CONFIG[entityType];
  if (!config) throw new Error(`Unknown entity type: ${entityType}`);
  if (count < 1) return [];

  const counter = await Counter.findOneAndUpdate(
    { _id: entityType },
    { $inc: { seq: count } },
    { upsert: true, returnDocument: 'after' }
  );

  const lastSeq = counter.seq;
  const firstSeq = lastSeq - count + 1;
  const ids = [];
  for (let i = firstSeq; i <= lastSeq; i++) {
    ids.push(config.prefix + formatNumber(i));
  }
  return ids;
}

// Syncs counters with existing data (call once on startup)
async function initializeCounters() {
  for (const [entityType, { model, field }] of Object.entries(ENTITY_CONFIG)) {
    const lastRecord = await model.findOne()
      .sort({ [field]: -1 })
      .select(field)
      .lean();

    // Extract max value from last record, or default to 0
    const recordValue = lastRecord ? lastRecord[field] : null;
    const currentMax = recordValue ? extractNumber(recordValue) : 0;
    if (currentMax > 0) {
      await Counter.findOneAndUpdate(
        { _id: entityType },
        { $max: { seq: currentMax } },
        { upsert: true, returnDocument: 'after' }
      );
    }
  }
}

module.exports = {
  generateId,
  generateIds,
  initializeCounters,
  extractNumber,
  formatNumber
};
