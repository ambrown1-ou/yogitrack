// apiClients.js - Centralized API client layer for YogiTrack frontend
// Three namespaced modules: AttendanceAPI, SchedulingAPI, CalendarAPI
// All methods POST to the backend and return data.results on success.
// On failure they throw an Error with the server's error message.
// Uses var to ensure global availability across UMD script tags.

// ---------------------------------------------------------------------------
// Internal helper: POST to a backend API endpoint and return results array.
// Throws an Error (with server message) on non-success responses.
// ---------------------------------------------------------------------------
var apiPost = async function (path, body) {
  var response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {})
  });
  var data = await response.json();
  if (!data.success) {
    var result = data.results && data.results[0];
    var msg = result
      ? (result.error || result.details || JSON.stringify(result))
      : 'Request failed';
    var err = new Error(msg);
    err.status = response.status;
    if (data.resultsType === 'confirmation') {
      err.isConfirmation = true;
      err.confirmText = result && result.confirmText ? result.confirmText : 'Confirm';
    }
    throw err;
  }
  return data.results;
};

// ---------------------------------------------------------------------------
// AttendanceAPI - Methods for the instructor attendance workflow
// ---------------------------------------------------------------------------
var AttendanceAPI = {

  // Look up the Instructor record matching the logged-in user's email.
  // Returns the instructor object, or null if not found.
  getInstructorRecord: async function (email) {
    var instructors = await SchedulingAPI.getAllInstructors();
    return instructors.find(function (i) {
      return i.email && i.email.toLowerCase() === email.toLowerCase();
    }) || null;
  },

  // Get upcoming ClassInstances taught by the given instructor within a date range.
  // Returns instances enriched with className and maxCapacity from their series.
  getInstructorClasses: async function (instructorId, startDate, endDate) {
    var allSeries = await SchedulingAPI.getAllClassSeries();
    var allInstances = [];

    for (var i = 0; i < allSeries.length; i++) {
      var series = allSeries[i];
      var instances;
      try {
        instances = await apiPost('/api/class/getClassInstances', {
          classId: series.classId,
          startDate: startDate,
          endDate: endDate
        });
      } catch (err) {
        // No instances for this series in range — skip
        continue;
      }
      for (var j = 0; j < instances.length; j++) {
        if (instances[j].instructorId === instructorId) {
          allInstances.push(Object.assign({}, instances[j], {
            className: series.className,
            maxCapacity: series.maxCapacity
          }));
        }
      }
    }

    // Sort by instanceDate ascending
    allInstances.sort(function (a, b) {
      return a.instanceDate.localeCompare(b.instanceDate);
    });
    return allInstances;
  },

  // Search for customers by partial last/first name (case-insensitive) for attendance workflow.
  // Returns an empty array if none found.
  searchCustomersByName: async function (lastName, firstName) {
    var body = {
      lastName: lastName.trim(),
      partialMatch: true
    };
    if (firstName && firstName.trim()) body.firstName = firstName.trim();
    try {
      return await apiPost('/api/customer/getCustomerByName', body);
    } catch (err) {
      // 404 means no match — return empty array instead of throwing
      if (err.status === 404) return [];
      throw err;
    }
  },

  // Get the count of attendance records already recorded for a class instance.
  // Used to display current attendance vs. capacity.
  getClassAttendanceCount: async function (instanceId) {
    try {
      var records = await apiPost('/api/attendance/getByClass', { instanceId: instanceId });
      return records.length;
    } catch (err) {
      if (err.status === 404) return 0;
      throw err;
    }
  },

  // Record attendance for one customer at a class instance.
  // Auto-fills today's date and current time.
  recordStudentAttendance: async function (instanceId, customerId) {
    return await apiPost('/api/attendance/recordAttendance', {
      instanceId: instanceId,
      customerId: customerId,
      attendanceDate: YogiUtils.todayStr(),
      attendanceTime: YogiUtils.currentTimeStr()
    });
  },

  // Fetch current attendance roster for a class instance with resolved customer names.
  getClassAttendanceList: async function (instanceId) {
    var records;
    try {
      records = await apiPost('/api/attendance/getByClass', { instanceId: instanceId });
    } catch (err) {
      if (err.status === 404) return [];
      throw err;
    }

    if (!records || records.length === 0) return [];

    var uniqueCustomerIds = Array.from(new Set(records.map(function (r) { return r.customerId; })));
    var customerMap = {};

    var customerResults = await Promise.allSettled(uniqueCustomerIds.map(function (customerId) {
      return CustomerAPI.getCustomerById(customerId);
    }));

    for (var i = 0; i < uniqueCustomerIds.length; i++) {
      if (customerResults[i].status === 'fulfilled' && customerResults[i].value) {
        customerMap[uniqueCustomerIds[i]] = customerResults[i].value;
      }
    }

    var roster = records.map(function (record) {
      var customer = customerMap[record.customerId];
      return {
        attendanceId: record.attendanceId,
        customerId: record.customerId,
        firstName: customer ? customer.firstName : record.customerId,
        lastName: customer ? customer.lastName : '',
        attendanceTime: record.attendanceTime || ''
      };
    });

    roster.sort(function (a, b) {
      var aLast = (a.lastName || '').toLowerCase();
      var bLast = (b.lastName || '').toLowerCase();
      if (aLast !== bLast) return aLast.localeCompare(bLast);

      var aFirst = (a.firstName || '').toLowerCase();
      var bFirst = (b.firstName || '').toLowerCase();
      if (aFirst !== bFirst) return aFirst.localeCompare(bFirst);

      return (a.attendanceId || '').localeCompare(b.attendanceId || '');
    });

    return roster;
  }

};

// ---------------------------------------------------------------------------
// SchedulingAPI - Methods for the manager scheduling workflow
// ---------------------------------------------------------------------------
var SchedulingAPI = {

  // Fetch all active class series.
  getAllClassSeries: async function () {
    return await apiPost('/api/class/getAllClassSeries', {});
  },

  // Fetch a single class series by classId.
  getClassSeries: async function (classId) {
    var results = await apiPost('/api/class/getClassSeries', { classId: classId });
    return results[0];
  },

  // Create a new class series (generates all instances for the date range automatically).
  addClassSeries: async function (data) {
    return await apiPost('/api/class/addClassSeries', data);
  },

  // Update class series metadata (name, type, capacity, payRate, defaultInstructor).
  updateClassSeries: async function (classId, updates) {
    return await apiPost('/api/class/updateClassSeries', Object.assign({ classId: classId }, updates));
  },

  // Soft-delete a class series and cancel all future instances.
  deleteClassSeries: async function (classId) {
    return await apiPost('/api/class/deleteClassSeries', { classId: classId });
  },

  // Fetch class instances for a series, optionally filtered by date range.
  getClassInstances: async function (classId, startDate, endDate) {
    var body = { classId: classId };
    if (startDate) body.startDate = startDate;
    if (endDate) body.endDate = endDate;
    return await apiPost('/api/class/getClassInstances', body);
  },

  // Update a class instance (instructor, time, duration, status, notes).
  updateClassInstance: async function (instanceId, updates) {
    return await apiPost('/api/class/updateClassInstance', Object.assign({ instanceId: instanceId }, updates));
  },

  // Cancel a class instance.
  cancelClassInstance: async function (instanceId) {
    return await apiPost('/api/class/cancelClassInstance', { instanceId: instanceId });
  },

  // Fetch all instructors.
  getAllInstructors: async function () {
    return await apiPost('/api/instructor/getAllInstructors', {});
  },

  // Add a new instructor.
  addInstructor: async function (data) {
    return await apiPost('/api/instructor/addInstructor', data);
  },

  // Update editable fields on an instructor record.
  updateInstructor: async function (instructorId, data) {
    return await apiPost('/api/instructor/updateInstructor', Object.assign({ instructorId: instructorId }, data));
  },

  // Delete (or deactivate) an instructor.
  deleteInstructor: async function (instructorId) {
    return await apiPost('/api/instructor/deleteInstructor', { instructorId: instructorId });
  }

};

// ---------------------------------------------------------------------------
// CalendarAPI - Methods for the calendar view (all roles)
// ---------------------------------------------------------------------------
var CalendarAPI = {

  // Fetch all class instances in a date range, enriched with className and maxCapacity.
  getCalendarClasses: async function (startDate, endDate) {
    var allSeries = await SchedulingAPI.getAllClassSeries();
    var allInstances = [];

    for (var i = 0; i < allSeries.length; i++) {
      var series = allSeries[i];
      var instances;
      try {
        instances = await SchedulingAPI.getClassInstances(series.classId, startDate, endDate);
      } catch (err) {
        continue;
      }
      for (var j = 0; j < instances.length; j++) {
        allInstances.push(Object.assign({}, instances[j], {
          className: series.className,
          maxCapacity: series.maxCapacity
        }));
      }
    }

    allInstances.sort(function (a, b) {
      return a.instanceDate.localeCompare(b.instanceDate);
    });
    return allInstances;
  },

  // Fetch class instances for a specific instructor in a date range.
  getCalendarClassesByInstructor: async function (instructorId, startDate, endDate) {
    var all = await CalendarAPI.getCalendarClasses(startDate, endDate);
    return all.filter(function (inst) {
      return inst.instructorId === instructorId;
    });
  }

};

// ---- User administration API ----
var UserAPI = {

  getAllUsers: async function () {
    return await apiPost('/api/user/getAllUsers', {});
  },

  changePassword: async function (newPassword) {
    return await apiPost('/api/user/changePassword', { newPassword: newPassword });
  }

};

// ---------------------------------------------------------------------------
// CustomerAPI - Methods for customer management (manager workflow)
// ---------------------------------------------------------------------------
var CustomerAPI = {

  getAllCustomers: async function () {
    return await apiPost('/api/customer/getAllCustomers', {});
  },

  addCustomer: async function (data) {
    return await apiPost('/api/customer/addCustomer', data);
  },

  getCustomerByName: async function (lastName, firstName) {
    var body = { lastName: lastName.trim() };
    if (firstName && firstName.trim()) body.firstName = firstName.trim();
    try {
      return await apiPost('/api/customer/getCustomerByName', body);
    } catch (err) {
      if (err.status === 404) return [];
      throw err;
    }
  },

  getCustomerById: async function (customerId) {
    var results = await apiPost('/api/customer/getCustomerById', { customerId: customerId });
    return results[0];
  },

  // Update editable fields on a customer record.
  updateCustomer: async function (customerId, data) {
    return await apiPost('/api/customer/updateCustomer', Object.assign({ customerId: customerId }, data));
  },

  // Delete (or deactivate) a customer.
  deleteCustomer: async function (customerId) {
    return await apiPost('/api/customer/deleteCustomer', { customerId: customerId });
  }

};
