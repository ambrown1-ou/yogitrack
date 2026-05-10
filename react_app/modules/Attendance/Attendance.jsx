// Attendance - Main module for instructors to view upcoming classes and record attendance.
// On load, looks up the instructor record via the logged-in user's email,
// then fetches upcoming class instances assigned to that instructor.

function Attendance({ user }) {
  var [instructor, setInstructor] = React.useState(null);
  var [classes, setClasses] = React.useState([]);
  var [isLoading, setIsLoading] = React.useState(true);
  var [error, setError] = React.useState('');
  var [selectedInstance, setSelectedInstance] = React.useState(null);
  var [pageSize, setPageSize] = React.useState(25);
  var [currentPage, setCurrentPage] = React.useState(1);

  React.useEffect(function () {
    loadInstructorAndClasses();
  }, []);

  // Resolve the instructor record from the logged-in user's email,
  // then fetch their upcoming class instances for the next 30 days
  async function loadInstructorAndClasses() {
    setIsLoading(true);
    setError('');
    try {
      var record = await AttendanceAPI.getInstructorRecord(user.email);
      // If no instructor record exists, the user can't take attendance
      if (!record) {
        setError('No instructor record found for this account. Contact your manager to set one up.');
        setIsLoading(false);
        return;
      }
      setInstructor(record);

      var today = YogiUtils.todayStr();
      var endDate = YogiUtils.futureDateStr(30);
      var upcomingClasses = await AttendanceAPI.getInstructorClasses(record.instructorId, today, endDate);
      setClasses(upcomingClasses);
    } catch (err) {
      setError(err.status ? err.message : 'Could not load your schedule. Please refresh and try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // Show the attendance form when an instance is selected
  if (selectedInstance) {
    return (
      <AttendanceForm
        instance={selectedInstance}
        onBack={function () { setSelectedInstance(null); }}
        onComplete={function () {
          setSelectedInstance(null);
          loadInstructorAndClasses();
        }}
      />
    );
  }

  var pagedClasses = YogiUtils.paginateControls(classes, pageSize, currentPage, setPageSize, setCurrentPage);

  return (
    <div className="card">
      <h2>Attendance</h2>
      {instructor && (
        <p>Showing upcoming classes for <strong>{instructor.firstName} {instructor.lastName}</strong> (next 30 days)</p>
      )}

      {isLoading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!isLoading && !error && classes.length === 0 && (
        <p>No upcoming classes scheduled for you in the next 30 days.</p>
      )}

      {!isLoading && !error && classes.length > 0 && pagedClasses.controls}
      {!isLoading && !error && classes.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Class</th>
              <th>Date</th>
              <th>Time</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {pagedClasses.visibleItems.map(function (inst) {
              return (
                <tr key={inst.instanceId}>
                  <td>{inst.className}</td>
                  <td>{YogiUtils.formatDate(inst.instanceDate)}</td>
                  <td>{YogiUtils.formatTime(inst.startTime)}</td>
                  <td>{inst.duration}</td>
                  <td>{inst.status}</td>
                  <td>
                    {inst.status === 'scheduled' && (
                      <button
                        className="link-button"
                        onClick={function () { setSelectedInstance(inst); }}
                      >
                        Take Attendance
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
