// AttendanceForm - Modal for recording walk-in attendance at a class instance.
// Instructor searches for customers by name, builds an attendance list, then submits.

function AttendanceForm({ instance, onBack, onComplete }) {
  var [searchLastName, setSearchLastName] = React.useState('');
  var [searchFirstName, setSearchFirstName] = React.useState('');
  var [searchResults, setSearchResults] = React.useState([]);
  var [attendees, setAttendees] = React.useState([]);
  var [attendanceCount, setAttendanceCount] = React.useState(0);
  var [existingAttendance, setExistingAttendance] = React.useState([]);
  var [isLoadingExistingAttendance, setIsLoadingExistingAttendance] = React.useState(false);
  var [existingAttendanceError, setExistingAttendanceError] = React.useState('');
  var [isSearching, setIsSearching] = React.useState(false);
  var [isSubmitting, setIsSubmitting] = React.useState(false);
  var [searchError, setSearchError] = React.useState('');
  var [submitError, setSubmitError] = React.useState('');
  var [submitSuccess, setSubmitSuccess] = React.useState('');

  async function loadExistingAttendance() {
    setIsLoadingExistingAttendance(true);
    setExistingAttendanceError('');
    try {
      var roster = await AttendanceAPI.getClassAttendanceList(instance.instanceId);
      setExistingAttendance(roster);
      setAttendanceCount(roster.length);
    } catch (err) {
      setExistingAttendance([]);
      setAttendanceCount(0);
      setExistingAttendanceError(err.message);
    } finally {
      setIsLoadingExistingAttendance(false);
    }
  }

  React.useEffect(function () {
    loadExistingAttendance();
  }, [instance.instanceId]);

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchFirstName.trim() && !searchLastName.trim()) {
      setSearchError('Enter a first name, last name, or both.');
      return;
    }
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
      loadExistingAttendance();
    }
  }

  var isOverCapacity = (attendanceCount + attendees.length) > instance.maxCapacity;

  return (
    <div className="card">
      <h2>Take Attendance</h2>

      <div className="info-box" style={{ marginBottom: '16px' }}>
        <strong>{instance.className}</strong><br />
        {YogiUtils.formatDate(instance.instanceDate)} - {YogiUtils.formatTime(instance.startTime)} ({YogiUtils.formatDuration(instance.duration)})<br />
        <span>
          Attendance so far: {attendanceCount} / {instance.maxCapacity}
          {isOverCapacity && (
            <span style={{ color: 'red', marginLeft: '8px' }}>(!) Over capacity</span>
          )}
        </span>

        <div style={{ marginTop: '8px' }}>
          <p style={{ margin: '0 0 4px', fontWeight: '700' }}>Current attendance list:</p>
          {isLoadingExistingAttendance && <p style={{ margin: 0 }}>Loading attendance list...</p>}
          {!isLoadingExistingAttendance && existingAttendanceError && (
            <p style={{ margin: 0, color: 'red' }}>Could not load attendance list: {existingAttendanceError}</p>
          )}
          {!isLoadingExistingAttendance && !existingAttendanceError && existingAttendance.length === 0 && (
            <p style={{ margin: 0 }}>No attendance recorded yet for this class.</p>
          )}
          {!isLoadingExistingAttendance && !existingAttendanceError && existingAttendance.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: '18px' }}>
              {existingAttendance.map(function (record) {
                return (
                  <li key={record.attendanceId}>
                    {record.firstName} {record.lastName}
                    {record.attendanceTime ? ' (' + YogiUtils.formatTime(record.attendanceTime) + ')' : ''}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
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
              placeholder="First or partial first"
            />
          </div>
          <div className="form-group" style={{ flex: 1, marginBottom: 0, minWidth: '120px' }}>
            <label>Last Name</label>
            <input
              type="text"
              value={searchLastName}
              onChange={function (e) { setSearchLastName(e.target.value); }}
              placeholder="Last or partial last"
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
                <span>{c.firstName} {c.lastName} - Balance: {c.classBalance}</span>
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
