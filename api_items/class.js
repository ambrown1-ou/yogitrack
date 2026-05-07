const { createRouter, sendError, sendSuccess } = require('../api_helpers/routeFactory');
const { ClassSeries, ClassInstance, DURATION_MINUTES, DAYS_OF_WEEK } = require('../api_models/Class');
const Instructor = require('../api_models/Instructor');
const { generateId } = require('../api_helpers/idGenerator');

const BACK = '/api/class';

// Converts a HH:MM string to minutes since midnight
function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

// Checks whether a proposed time slot overlaps any existing non-cancelled instance on the same date.
// Returns an array of conflict descriptor objects (empty = no conflicts).
// Pass excludeInstanceId to ignore a specific instance (used when updating an existing instance).
async function checkStudioConflict(instanceDate, startTime, duration, excludeInstanceId = null) {
  const newStart = timeToMinutes(startTime);
  const newEnd = newStart + DURATION_MINUTES[duration];

  const query = { instanceDate, status: { $ne: 'cancelled' } };
  if (excludeInstanceId) query.instanceId = { $ne: excludeInstanceId };

  const existing = await ClassInstance.find(query).lean();
  const conflicts = [];
  for (const inst of existing) {
    const existStart = timeToMinutes(inst.startTime);
    const existEnd = existStart + DURATION_MINUTES[inst.duration];
    if (newStart < existEnd && newEnd > existStart) {
      conflicts.push({
        instanceId: inst.instanceId,
        instanceDate: inst.instanceDate.toISOString().split('T')[0],
        startTime: inst.startTime,
        duration: inst.duration
      });
    }
  }
  return conflicts;
}

// Returns all UTC dates between startDate and endDate (inclusive) that fall on the given daysOfWeek.
// JS getUTCDay(): 0=Sunday, 1=Monday, ..., 6=Saturday
const UTC_DAY_INDEX = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };

function generateInstanceDates(startDate, endDate, daysOfWeek) {
  const dates = [];
  const targetDays = new Set(daysOfWeek.map(d => UTC_DAY_INDEX[d]));
  let current = new Date(startDate.getTime());
  while (current <= endDate) {
    if (targetDays.has(current.getUTCDay())) {
      dates.push(new Date(current.getTime()));
    }
    current = new Date(current.getTime() + 86400000);
  }
  return dates;
}

module.exports = createRouter({
  moduleTitle: 'Class',
  basePath: BACK,
  methods: {
    addClassSeries: {
      fields: ['className', 'classType', 'startDate', 'endDate', 'daysOfWeek', 'startTime', 'duration', 'defaultInstructorId', 'maxCapacity', 'payRate'],
      required: ['className', 'classType', 'startDate', 'endDate', 'daysOfWeek', 'startTime', 'duration', 'payRate']
    },
    getClassSeries: { fields: ['classId'], required: ['classId'] },
    getAllClassSeries: { fields: [] },
    updateClassSeries: {
      fields: ['classId', 'className', 'classType', 'maxCapacity', 'payRate', 'defaultInstructorId'],
      required: ['classId']
    },
    deleteClassSeries: { fields: ['classId'], required: ['classId'] },
    getClassInstances: { fields: ['classId', 'startDate', 'endDate'], required: ['classId'] },
    updateClassInstance: {
      fields: ['instanceId', 'instructorId', 'startTime', 'duration', 'status', 'notes'],
      required: ['instanceId']
    },
    cancelClassInstance: { fields: ['instanceId'], required: ['instanceId'] },
  },
  handlers: {
    // Creates a ClassSeries and generates one ClassInstance for each matching date in the range.
    // Validates that no instance would conflict with an existing scheduled class in the studio.
    async addClassSeries(req, res) {
      // Normalize daysOfWeek — form may send it as a single string or array
      const raw = req.body;
      if (raw.daysOfWeek && !Array.isArray(raw.daysOfWeek)) {
        raw.daysOfWeek = [raw.daysOfWeek];
      }

      const errors = ClassSeries.validate(raw);
      if (errors.length)
        return sendError(res, 400, 'Validation Failed', errors.join('; '), BACK);

      const { className, classType, startDate, endDate, daysOfWeek, startTime, duration, defaultInstructorId, maxCapacity, payRate } = raw;

      // If a default instructor is given, verify they exist
      if (defaultInstructorId) {
        const instructor = await Instructor.findOne({ instructorId: defaultInstructorId.trim(), isActive: true }).lean();
        if (!instructor)
          return sendError(res, 400, 'Instructor Not Found', `No active instructor found with ID: ${defaultInstructorId}`, BACK);
      }

      const start = new Date(startDate + 'T00:00:00Z');
      const end = new Date(endDate + 'T00:00:00Z');
      const instanceDates = generateInstanceDates(start, end, daysOfWeek);

      if (instanceDates.length === 0)
        return sendError(res, 400, 'No Instances Generated', 'The selected days of week produce no dates within the start/end range', BACK);

      // Check studio conflicts for every date before creating anything
      const allConflicts = [];
      for (const date of instanceDates) {
        const conflicts = await checkStudioConflict(date, startTime, duration);
        allConflicts.push(...conflicts);
      }
      if (allConflicts.length > 0) {
        return sendError(res, 409, 'Studio Conflict Detected',
          `The proposed schedule overlaps existing classes on ${allConflicts.length} occurrence(s): ${allConflicts.map(c => `${c.instanceDate} ${c.startTime} (${c.duration})`).join('; ')}`,
          BACK);
      }

      const classId = await generateId('class');
      const series = new ClassSeries({
        classId,
        className: className.trim(),
        classType,
        startDate: start,
        endDate: end,
        daysOfWeek,
        startTime,
        duration,
        defaultInstructorId: defaultInstructorId ? defaultInstructorId.trim() : null,
        maxCapacity: maxCapacity ? Number(maxCapacity) : 20,
        payRate: Number(payRate),
        isActive: true
      });
      await series.save();

      // Generate all instances; instructorId is required — use default or placeholder
      const instances = [];
      for (const date of instanceDates) {
        const instanceId = await generateId('instance');
        const inst = new ClassInstance({
          instanceId,
          classId,
          instanceDate: date,
          startTime,
          duration,
          instructorId: defaultInstructorId ? defaultInstructorId.trim() : 'UNASSIGNED',
          status: 'scheduled'
        });
        await inst.save();
        instances.push(ClassInstance.serialize(inst.toObject()));
      }

      sendSuccess(res, `Class Series Created with ${instances.length} Instance(s)`, {
        series: ClassSeries.serialize(series.toObject()),
        instanceCount: instances.length,
        instances
      }, BACK);
    },

    // Retrieves a ClassSeries by classId, including instance count
    async getClassSeries(req, res) {
      const { classId } = req.body;
      const series = await ClassSeries.findOne({ classId: classId.trim() }).lean();
      if (!series)
        return sendError(res, 404, 'Class Not Found', `No class series found with ID: ${classId}`, BACK);

      const instanceCount = await ClassInstance.countDocuments({ classId: classId.trim() });
      sendSuccess(res, 'Class Retrieved', { ...ClassSeries.serialize(series), instanceCount }, BACK);
    },

    // Returns all active class series with instance counts
    async getAllClassSeries(req, res) {
      const allSeries = await ClassSeries.find({ isActive: true }).lean();
      const results = await Promise.all(allSeries.map(async s => {
        const instanceCount = await ClassInstance.countDocuments({ classId: s.classId });
        return { ...ClassSeries.serialize(s), instanceCount };
      }));
      sendSuccess(res, `Retrieved ${results.length} Class Series`, results, BACK);
    },

    // Updates series metadata only — does not modify existing instances
    async updateClassSeries(req, res) {
      const { classId, className, classType, maxCapacity, payRate, defaultInstructorId } = req.body;

      const series = await ClassSeries.findOne({ classId: classId.trim() });
      if (!series)
        return sendError(res, 404, 'Class Not Found', `No class series found with ID: ${classId}`, BACK);

      if (className) series.className = className.trim();
      if (classType) {
        if (!['General', 'Special'].includes(classType))
          return sendError(res, 400, 'Validation Failed', 'Class type must be "General" or "Special"', BACK);
        series.classType = classType;
      }
      if (maxCapacity !== undefined) {
        const cap = Number(maxCapacity);
        if (isNaN(cap) || cap < 1)
          return sendError(res, 400, 'Validation Failed', 'Max capacity must be at least 1', BACK);
        series.maxCapacity = cap;
      }
      if (payRate !== undefined) {
        const rate = Number(payRate);
        if (isNaN(rate) || rate < 0)
          return sendError(res, 400, 'Validation Failed', 'Pay rate must be a non-negative number', BACK);
        series.payRate = rate;
      }
      if (defaultInstructorId !== undefined) {
        if (defaultInstructorId) {
          const instructor = await Instructor.findOne({ instructorId: defaultInstructorId.trim(), isActive: true }).lean();
          if (!instructor)
            return sendError(res, 400, 'Instructor Not Found', `No active instructor found with ID: ${defaultInstructorId}`, BACK);
        }
        series.defaultInstructorId = defaultInstructorId ? defaultInstructorId.trim() : null;
      }

      await series.save();
      sendSuccess(res, 'Class Series Updated', ClassSeries.serialize(series.toObject()), BACK);
    },

    // Soft-deletes a series and cancels all future instances
    async deleteClassSeries(req, res) {
      const { classId } = req.body;

      const series = await ClassSeries.findOne({ classId: classId.trim() }).lean();
      if (!series)
        return sendError(res, 404, 'Class Not Found', `No class series found with ID: ${classId}`, BACK);

      const today = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z');
      const cancelResult = await ClassInstance.updateMany(
        { classId: classId.trim(), instanceDate: { $gte: today }, status: 'scheduled' },
        { status: 'cancelled' }
      );

      await ClassSeries.updateOne({ classId: classId.trim() }, { isActive: false });

      sendSuccess(res, `Class Series deactivated; ${cancelResult.modifiedCount} future instance(s) cancelled`, {
        classId,
        isActive: false,
        instancesCancelled: cancelResult.modifiedCount
      }, BACK);
    },

    // Returns all instances for a class series, sorted by instanceDate.
    // Optionally filters by startDate and/or endDate (inclusive, YYYY-MM-DD).
    async getClassInstances(req, res) {
      const { classId, startDate, endDate } = req.body;

      const series = await ClassSeries.findOne({ classId: classId.trim() }).lean();
      if (!series)
        return sendError(res, 404, 'Class Not Found', `No class series found with ID: ${classId}`, BACK);

      const query = { classId: classId.trim() };
      if (startDate || endDate) {
        query.instanceDate = {};
        if (startDate) query.instanceDate.$gte = new Date(startDate + 'T00:00:00Z');
        if (endDate)   query.instanceDate.$lte = new Date(endDate   + 'T00:00:00Z');
      }

      const instances = await ClassInstance.find(query)
        .sort({ instanceDate: 1 })
        .lean();

      sendSuccess(res, `Retrieved ${instances.length} Instance(s) for Class ${classId}`,
        instances.map(i => ClassInstance.serialize(i)), BACK);
    },

    // Updates a single class instance independently; re-checks studio conflicts if time or duration changes
    async updateClassInstance(req, res) {
      const { instanceId, instructorId, startTime, duration, status, notes } = req.body;

      const inst = await ClassInstance.findOne({ instanceId: instanceId.trim() });
      if (!inst)
        return sendError(res, 404, 'Instance Not Found', `No class instance found with ID: ${instanceId}`, BACK);

      // Validate duration if changing
      const newDuration = duration || inst.duration;
      const newStartTime = startTime || inst.startTime;

      if (duration && !Object.keys(DURATION_MINUTES).includes(duration))
        return sendError(res, 400, 'Validation Failed', `Duration must be one of: ${Object.keys(DURATION_MINUTES).join(', ')}`, BACK);
      if (startTime && !/^\d{2}:\d{2}$/.test(startTime))
        return sendError(res, 400, 'Validation Failed', 'Start time must be in HH:MM format', BACK);
      if (status && !['scheduled', 'cancelled', 'completed'].includes(status))
        return sendError(res, 400, 'Validation Failed', 'Status must be "scheduled", "cancelled", or "completed"', BACK);

      // If time or duration is changing, re-check studio conflicts (excluding this instance)
      if ((startTime && startTime !== inst.startTime) || (duration && duration !== inst.duration)) {
        const conflicts = await checkStudioConflict(inst.instanceDate, newStartTime, newDuration, instanceId.trim());
        if (conflicts.length > 0) {
          return sendError(res, 409, 'Studio Conflict Detected',
            `Updated time overlaps: ${conflicts.map(c => `${c.instanceDate} ${c.startTime} (${c.duration})`).join('; ')}`,
            BACK);
        }
      }

      if (instructorId) {
        const instructor = await Instructor.findOne({ instructorId: instructorId.trim(), isActive: true }).lean();
        if (!instructor)
          return sendError(res, 400, 'Instructor Not Found', `No active instructor found with ID: ${instructorId}`, BACK);
        inst.instructorId = instructorId.trim();
      }
      if (startTime) inst.startTime = startTime;
      if (duration) inst.duration = duration;
      if (status) inst.status = status;
      if (notes !== undefined) inst.notes = notes;

      await inst.save();
      sendSuccess(res, 'Instance Updated', ClassInstance.serialize(inst.toObject()), BACK);
    },

    // Cancels a single class instance
    async cancelClassInstance(req, res) {
      const { instanceId } = req.body;

      const inst = await ClassInstance.findOne({ instanceId: instanceId.trim() });
      if (!inst)
        return sendError(res, 404, 'Instance Not Found', `No class instance found with ID: ${instanceId}`, BACK);

      if (inst.status === 'cancelled')
        return sendError(res, 400, 'Already Cancelled', `Instance ${instanceId} is already cancelled`, BACK);

      inst.status = 'cancelled';
      await inst.save();
      sendSuccess(res, 'Instance Cancelled', ClassInstance.serialize(inst.toObject()), BACK);
    }
  }
});