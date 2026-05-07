// InstanceForm - Form for editing an existing class instance (instructor, time, duration).
// Creating instances is handled automatically by addClassSeries on the backend.

function InstanceForm({ instance, seriesList, instructors, onSave, onCancel }) {
  var [instructorId, setInstructorId] = React.useState(instance.instructorId || '');
  var [startTime, setStartTime] = React.useState(instance.startTime || '');
  var [duration, setDuration] = React.useState(instance.duration || 'Standard');
  var [isSubmitting, setIsSubmitting] = React.useState(false);
  var [error, setError] = React.useState('');

  var series = seriesList.find(function (s) { return s.classId === instance.classId; });

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      var updates = {};
      if (instructorId !== instance.instructorId) updates.instructorId = instructorId || 'UNASSIGNED';
      if (startTime !== instance.startTime) updates.startTime = startTime;
      if (duration !== instance.duration) updates.duration = duration;

      if (Object.keys(updates).length === 0) {
        onCancel();
        return;
      }
      await SchedulingAPI.updateClassInstance(instance.instanceId, updates);
      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="card">
      <h2>Edit Class Instance</h2>

      <div className="info-box" style={{ marginBottom: '16px' }}>
        <strong>{series ? series.className : instance.classId}</strong><br />
        {YogiUtils.formatDate(instance.instanceDate)} &mdash; originally {YogiUtils.formatTime(instance.startTime)} ({instance.duration})
      </div>

      {error && <p style={{ color: 'red', marginBottom: '16px' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Instructor</label>
          <select value={instructorId} onChange={function (e) { setInstructorId(e.target.value); }}>
            <option value="">— Unassigned —</option>
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
            <label>Start Time</label>
            <input
              type="time"
              value={startTime}
              onChange={function (e) { setStartTime(e.target.value); }}
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Duration</label>
            <select value={duration} onChange={function (e) { setDuration(e.target.value); }}>
              <option value="Short">Short (60 min)</option>
              <option value="Standard">Standard (75 min)</option>
              <option value="Long">Long (90 min)</option>
            </select>
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
