// SeriesEditForm - Edit the safe fields of an existing class series.
// Locked (structural) fields: startDate, daysOfWeek, startTime, duration.
// On save, propagates defaultInstructor changes to future instances that haven't been individually reassigned.

function SeriesEditForm({ series, instructors, onSave, onCancel }) {
  var [formData, setFormData] = React.useState({
    className: series.className || '',
    classType: series.classType || 'General',
    endDate: series.endDate || '',
    maxCapacity: String(series.maxCapacity || '20'),
    payRate: String(series.payRate || ''),
    defaultInstructorId: series.defaultInstructorId || ''
  });
  var [isSubmitting, setIsSubmitting] = React.useState(false);
  var [error, setError] = React.useState('');
  var [overwriteInstructor, setOverwriteInstructor] = React.useState(false);

  function handleChange(field, value) {
    setFormData(function (prev) {
      return Object.assign({}, prev, { [field]: value });
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      // Build only the changed fields
      var updates = {};
      if (formData.className !== series.className) updates.className = formData.className;
      if (formData.classType !== series.classType) updates.classType = formData.classType;
      if (formData.endDate !== series.endDate) updates.endDate = formData.endDate;
      if (formData.maxCapacity !== String(series.maxCapacity)) updates.maxCapacity = Number(formData.maxCapacity);
      if (formData.payRate !== String(series.payRate)) updates.payRate = Number(formData.payRate);
      if (formData.defaultInstructorId !== series.defaultInstructorId) updates.defaultInstructorId = formData.defaultInstructorId;

      if (Object.keys(updates).length > 0) {
        await SchedulingAPI.updateClassSeries(series.classId, updates);

        // Propagate instructor change to future instances that still have the old default
        if (updates.defaultInstructorId !== undefined) {
          var today = YogiUtils.todayStr();
          var futureInstances = await SchedulingAPI.getClassInstances(series.classId, today, series.endDate);
          var oldInstructorId = series.defaultInstructorId;
          var newInstructorId = updates.defaultInstructorId;

          var propagatePromises = futureInstances
            .filter(function (inst) {
              if (inst.status !== 'scheduled') return false;
              if (overwriteInstructor) return true;
              return inst.instructorId === oldInstructorId;
            })
            .map(function (inst) {
              return SchedulingAPI.updateClassInstance(inst.instanceId, { instructorId: newInstructorId || 'UNASSIGNED' });
            });

          await Promise.all(propagatePromises);
        }
      }

      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="card">
      <h2>Edit Class Series</h2>

      {/* Read-only structural fields */}
      <div className="info-box" style={{ marginBottom: '16px' }}>
        <strong>Structural fields (locked)</strong><br />
        <span style={{ fontSize: '0.9rem' }}>
          Start: {series.startDate} {' | '}
          Days: {series.daysOfWeek.map(function (d) { return d.slice(0, 3); }).join(', ')} {' | '}
          Time: {YogiUtils.formatTime(series.startTime)} {' | '}
          Duration: {series.duration}
        </span>
      </div>

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

        <div className="form-group">
          <label>End Date *</label>
          <input
            type="date"
            value={formData.endDate}
            min={series.startDate}
            max={(function () { var d = new Date(); d.setFullYear(d.getFullYear() + 2); return d.toISOString().split('T')[0]; })()}
            onChange={function (e) { handleChange('endDate', e.target.value); }}
            required
          />
        </div>

        <div className="form-group">
          <label>Default Instructor</label>
          <select
            value={formData.defaultInstructorId}
            onChange={function (e) { handleChange('defaultInstructorId', e.target.value); }}
          >
            <option value="">-- None --</option>
            {instructors.map(function (i) {
              return (
                <option key={i.instructorId} value={i.instructorId}>
                  {i.firstName} {i.lastName}
                </option>
              );
            })}
          </select>
          {formData.defaultInstructorId !== series.defaultInstructorId && (
            <div style={{ marginTop: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontWeight: 'normal', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  style={{ width: 'auto', marginTop: '2px' }}
                  checked={overwriteInstructor}
                  onChange={function (e) { setOverwriteInstructor(e.target.checked); }}
                />
                <span>
                  {overwriteInstructor
                    ? 'All future scheduled instances will be reassigned to the new default instructor.'
                    : 'Only instances still using the previous default instructor will be updated. Check to overwrite all.'}
                </span>
              </label>
            </div>
          )}
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
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
