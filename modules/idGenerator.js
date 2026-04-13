/* ID Generator Utility:
  Generates unique IDs for different entity types
 Format: PREFIX + 5-digit number (e.g., I00001, C00001, P00001, etc.)
 */

const Instructor = require('../models/Instructor');
const Customer = require('../models/Customer');
const Package = require('../models/Package');
const Class = require('../models/Class');
const Sale = require('../models/Sale');
const Attendance = require('../models/Attendance');

const ENTITY_CONFIG = {
  instructor:  { prefix: 'I',  model: Instructor,  field: 'instructorId' },
  customer:    { prefix: 'C',  model: Customer,    field: 'customerId' },
  package:     { prefix: 'P',  model: Package,     field: 'packageId' },
  class:       { prefix: 'CL', model: Class,       field: 'classId' },
  sale:        { prefix: 'S',  model: Sale,        field: 'saleId' },
  attendance:  { prefix: 'A',  model: Attendance,  field: 'attendanceId' },
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

// Generates the next sequential ID for a given entity type
async function generateId(entityType) {
  const config = ENTITY_CONFIG[entityType];
  if (!config) throw new Error(`Unknown entity type: ${entityType}`);

  const { prefix, model, field } = config;

  const lastRecord = await model.findOne()
    .sort({ [field]: -1 })
    .select(field)
    .lean();

  const nextNumber = lastRecord?.[field] ? extractNumber(lastRecord[field]) + 1 : 1;
  return prefix + formatNumber(nextNumber);
}

module.exports = {
  generateId,
  extractNumber,
  formatNumber
};
