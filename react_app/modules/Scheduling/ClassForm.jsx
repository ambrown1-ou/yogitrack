// ClassForm - Form for creating a new class series.
// Supports one-off (single instance) and recurring (multi-instance) modes.
// When "Recurring" is unchecked, end date and days-of-week are hidden;
// on submit the end date matches the start date and the weekday is derived automatically.

function ClassForm({ instructors, onSave, onCancel }) {
  var DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  // JS getDay() returns 0=Sun..6=Sat
  var JS_DAY_TO_NAME = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var DURATIONS = [
    { value: 'Short', label: 'Short (60 min)' },
    { value: 'Standard', label: 'Standard (75 min)' },
    { value: 'Long', label: 'Long (90 min)' }
  ];

  var [formData, setFormData] = React.useState({
    className: '',
    classType: 'General',
    startDate: '',
    endDate: '',
    daysOfWeek: [],
    startTime: '',
    duration: 'Standard',
    defaultInstructorId: '',
    maxCapacity: '20',
    payRate: ''
  });
  var [isSubmitting, setIsSubmitting] = React.useState(false);
  var [isRecurring, setIsRecurring] = React.useState(false);
  var [error, setError] = React.useState('');

  function handleChange(field, value) {
    setFormData(function (prev) {
      return Object.assign({}, prev, { [field]: value });
    });
  }

  function handleDayToggle(day) {
    setFormData(function (prev) {
      var days = prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(function (d) { return d !== day; })
        : prev.daysOfWeek.concat(day);
      return Object.assign({}, prev, { daysOfWeek: days });
    });
  }

  function handleRecurringToggle(checked) {
    setIsRecurring(checked);
    if (!checked) {
      setFormData(function (prev) {
        return Object.assign({}, prev, { daysOfWeek: [], endDate: '' });
      });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    var payload = Object.assign({}, formData);

    if (!isRecurring) {
      // One-off: derive weekday from start date; end date = start date
      if (!payload.startDate) {
        setError('Start date is required.');
        return;
      }
      // Parse at noon local time to avoid timezone day-boundary shift
      var parts = payload.startDate.split('-');
      var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
      payload.daysOfWeek = [JS_DAY_TO_NAME[d.getDay()]];
      payload.endDate = payload.startDate;
    } else {
      if (payload.daysOfWeek.length === 0) {
        setError('Select at least one day of the week.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await SchedulingAPI.addClassSeries(payload);
      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="card">
      <h2>New Class</h2>
      {error && <p style={{ color: 'red', marginBottom: '16px' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Class Name *</label>
          <input
            type="text"
            value={formData.className}
            onChange={function (e) { handleChange('className', e.target.value); }}
            required
          />
        </div>

        <div className="form-group">
          <label>Class Type *</label>
          <select
            value={formData.classType}
            onChange={function (e) { handleChange('classType', e.target.value); }}
          >
            <option value="General">General</option>
            <option value="Special">Special</option>
          </select>
        </div>

        {/* Recurring toggle */}
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'normal', cursor: 'pointer' }}>
            <input
              type="checkbox"
              style={{ width: 'auto' }}
              checked={isRecurring}
              onChange={function (e) { handleRecurringToggle(e.target.checked); }}
            />
            <strong>Recurring</strong> &mdash; repeats on selected days until an end date
          </label>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Start Date *</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={function (e) { handleChange('startDate', e.target.value); }}
              required
            />
          </div>
          {isRecurring && (
            <div className="form-group" style={{ flex: 1 }}>
              <label>End Date *</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={function (e) { handleChange('endDate', e.target.value); }}
                required
              />
            </div>
          )}
        </div>

        {isRecurring && (
          <div className="form-group">
            <label>Days of Week *</label>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '6px' }}>
              {DAYS.map(function (day) {
                return (
                  <label key={day} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'normal', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      style={{ width: 'auto' }}
                      checked={formData.daysOfWeek.includes(day)}
                      onChange={function () { handleDayToggle(day); }}
                    />
                    {day.slice(0, 3)}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Start Time *</label>
            <input
              type="time"
              value={formData.startTime}
              onChange={function (e) { handleChange('startTime', e.target.value); }}
              required
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Duration *</label>
            <select
              value={formData.duration}
              onChange={function (e) { handleChange('duration', e.target.value); }}
            >
              {DURATIONS.map(function (d) {
                return <option key={d.value} value={d.value}>{d.label}</option>;
              })}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Default Instructor</label>
          <select
            value={formData.defaultInstructorId}
            onChange={function (e) { handleChange('defaultInstructorId', e.target.value); }}
          >
            <option value="">— None —</option>
            {instructors.map(function (i) {
              return (
                <option key={i.instructorId} value={i.instructorId}>
                  {i.firstName} {i.lastName}
                </option>
              );
            })}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Max Capacity</label>
            <input
              type="number"
              min="1"
              value={formData.maxCapacity}
              onChange={function (e) { handleChange('maxCapacity', e.target.value); }}
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Pay Rate *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.payRate}
              onChange={function (e) { handleChange('payRate', e.target.value); }}
              required
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel}>Cancel</button>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : (isRecurring ? 'Create Class Series' : 'Create Class')}
          </button>
        </div>
      </form>
    </div>
  );
}
