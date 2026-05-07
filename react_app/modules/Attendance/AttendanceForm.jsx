// AttendanceForm - Modal for recording walk-in attendance at a class instance.
// Instructor searches for customers by name, builds an attendance list, then submits.

function AttendanceForm({ instance, onBack, onComplete }) {
  var [searchLastName, setSearchLastName] = React.useState('');
  var [searchFirstName, setSearchFirstName] = React.useState('');
  var [searchResults, setSearchResults] = React.useState([]);
  var [attendees, setAttendees] = React.useState([]);
  var [attendanceCount, setAttendanceCount] = React.useState(0);
  var [isSearching, setIsSearching] = React.useState(false);
  var [isSubmitting, setIsSubmitting] = React.useState(false);
  var [searchError, setSearchError] = React.useState('');
  var [submitError, setSubmitError] = React.useState('');
  var [submitSuccess, setSubmitSuccess] = React.useState('');

  React.useEffect(function () {
    AttendanceAPI.getClassAttendanceCount(instance.instanceId)
      .then(function (count) { setAttendanceCount(count); })
      .catch(function () {});
  }, [instance.instanceId]);

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchLastName.trim()) return;
    setIsSearching(true);
    setSearchError('');
    setSearchResults([]);
    try {
      var results = await AttendanceAPI.searchCustomersByName(searchLastName, searchFirstName);
      setSearchResults(results);
      if (results.length === 0) setSearchError('No customers found with that name.');
    } catch (err) {
      setSearchError(err.message);
    } finally {
      setIsSearching(false);
    }
  }

  function handleAddCustomer(customer) {
    if (attendees.find(function (a) { return a.customerId === customer.customerId; })) return;
    setAttendees(function (prev) { return prev.concat(customer); });
    setSearchResults([]);
    setSearchLastName('');
    setSearchFirstName('');
    setSearchError('');
  }

  function handleRemoveAttendee(customerId) {
    setAttendees(function (prev) { return prev.filter(function (a) { return a.customerId !== customerId; }); });
  }

  async function handleSubmit() {
    if (attendees.length === 0) {
      setSubmitError('Add at least one customer before submitting.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');

    var successCount = 0;
    var errors = [];

    for (var i = 0; i < attendees.length; i++) {
      var attendee = attendees[i];
      try {
        await AttendanceAPI.recordStudentAttendance(instance.instanceId, attendee.customerId);
        successCount++;
      } catch (err) {
        errors.push(attendee.firstName + ' ' + attendee.lastName + ': ' + err.message);
      }
    }

    setIsSubmitting(false);

    if (errors.length > 0) {
      setSubmitError(errors.join(' | '));
    }
    if (successCount > 0) {
      setSubmitSuccess('Attendance recorded for ' + successCount + ' student(s).');
      setAttendees([]);
      setAttendanceCount(function (prev) { return prev + successCount; });
    }
  }

  var isOverCapacity = (attendanceCount + attendees.length) > instance.maxCapacity;

  return (
    <div className="card">
      <h2>Take Attendance</h2>

      <div className="info-box" style={{ marginBottom: '16px' }}>
        <strong>{instance.className}</strong><br />
        {YogiUtils.formatDate(instance.instanceDate)} &mdash; {YogiUtils.formatTime(instance.startTime)} ({YogiUtils.formatDuration(instance.duration)})<br />
        <span>
          Attendance so far: {attendanceCount} / {instance.maxCapacity}
          {isOverCapacity && (
            <span style={{ color: 'red', marginLeft: '8px' }}>&#9888; Over capacity</span>
          )}
        </span>
      </div>

      {submitSuccess && <p style={{ color: 'green', marginBottom: '12px' }}>{submitSuccess}</p>}
      {submitError && <p style={{ color: 'red', marginBottom: '12px' }}>{submitError}</p>}

      {/* Customer search */}
      <form onSubmit={handleSearch}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '8px', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, marginBottom: 0, minWidth: '120px' }}>
            <label>First Name</label>
            <input
              type="text"
              value={searchFirstName}
              onChange={function (e) { setSearchFirstName(e.target.value); }}
              placeholder="Optional"
            />
          </div>
          <div className="form-group" style={{ flex: 1, marginBottom: 0, minWidth: '120px' }}>
            <label>Last Name *</label>
            <input
              type="text"
              value={searchLastName}
              onChange={function (e) { setSearchLastName(e.target.value); }}
              placeholder="Required"
              required
            />
          </div>
          <button type="submit" disabled={isSearching} style={{ flex: 'unset', whiteSpace: 'nowrap' }}>
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {searchError && <p style={{ color: 'red', marginBottom: '8px', fontSize: '0.9rem' }}>{searchError}</p>}

      {/* Search results */}
      {searchResults.length > 0 && (
        <div style={{ border: '1px solid #000', marginBottom: '16px' }}>
          {searchResults.map(function (c) {
            var alreadyAdded = !!attendees.find(function (a) { return a.customerId === c.customerId; });
            return (
              <div key={c.customerId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #ccc' }}>
                <span>{c.firstName} {c.lastName} &mdash; Balance: {c.classBalance}</span>
                <button
                  onClick={function () { handleAddCustomer(c); }}
                  className="link-button"
                  disabled={alreadyAdded}
                >
                  {alreadyAdded ? 'Added' : 'Add'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Attendee list */}
      {attendees.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontWeight: '700', marginBottom: '8px' }}>Attending Today ({attendees.length})</p>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Current Balance</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {attendees.map(function (a) {
                return (
                  <tr key={a.customerId}>
                    <td>{a.firstName} {a.lastName}</td>
                    <td>{a.classBalance}</td>
                    <td>
                      <button
                        onClick={function () { handleRemoveAttendee(a.customerId); }}
                        className="link-button"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="form-actions">
        <button type="button" onClick={onBack}>Back</button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || attendees.length === 0}
        >
          {isSubmitting ? 'Recording...' : 'Record Attendance (' + attendees.length + ')'}
        </button>
      </div>
    </div>
  );
}
