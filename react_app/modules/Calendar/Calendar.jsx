// Calendar - Monthly calendar view showing all scheduled class instances.
// Managers can edit instances and series from the day detail panel.

function Calendar({ user }) {
  var MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  var DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  var today = new Date();
  var [year, setYear] = React.useState(today.getFullYear());
  var [month, setMonth] = React.useState(today.getMonth()); // 0-indexed
  var [instances, setInstances] = React.useState([]);
  var [seriesList, setSeriesList] = React.useState([]);
  var [instructorList, setInstructorList] = React.useState([]);
  var [instructorRecord, setInstructorRecord] = React.useState(null);
  var [viewMode, setViewMode] = React.useState(user.role === 'instructor' ? 'mine' : 'all');
  var [isLoading, setIsLoading] = React.useState(false);
  var [error, setError] = React.useState('');
  var [selectedDay, setSelectedDay] = React.useState(null);
  var [editingInstance, setEditingInstance] = React.useState(null);
  var [editingSeries, setEditingSeries] = React.useState(null);

  // Load series + instructors once (needed for edit forms)
  React.useEffect(function () {
    if (user.role === 'manager') {
      Promise.all([
        SchedulingAPI.getAllClassSeries(),
        SchedulingAPI.getAllInstructors()
      ]).then(function (results) {
        setSeriesList(results[0]);
        setInstructorList(results[1]);
      }).catch(function () {});
    }
  }, []);

  React.useEffect(function () {
    if (user.role !== 'instructor') return;

    AttendanceAPI.getInstructorRecord(user.email)
      .then(function (record) {
        setInstructorRecord(record || null);
      })
      .catch(function () {
        setInstructorRecord(null);
      });
  }, [user.role, user.email]);

  React.useEffect(function () {
    loadCalendar(year, month);
  }, [year, month, viewMode, instructorRecord ? instructorRecord.instructorId : '']);

  async function loadCalendar(y, m) {
    setIsLoading(true);
    setError('');
    setSelectedDay(null);
    try {
      var startDate = y + '-' + String(m + 1).padStart(2, '0') + '-01';
      var lastDay = new Date(y, m + 1, 0).getDate();
      var endDate = y + '-' + String(m + 1).padStart(2, '0') + '-' + String(lastDay).padStart(2, '0');

      var data;
      if (user.role === 'instructor' && viewMode === 'mine') {
        if (!instructorRecord || !instructorRecord.instructorId) {
          setInstances([]);
          setError('No instructor record found for this account. Showing no classes in My Classes view.');
          return;
        }
        data = await CalendarAPI.getCalendarClassesByInstructor(instructorRecord.instructorId, startDate, endDate);
      } else {
        data = await CalendarAPI.getCalendarClasses(startDate, endDate);
      }

      setInstances(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(function (y) { return y - 1; }); }
    else setMonth(function (m) { return m - 1; });
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(function (y) { return y + 1; }); }
    else setMonth(function (m) { return m + 1; });
  }

  // Group instances by their YYYY-MM-DD date key
  var instancesByDate = {};
  instances.forEach(function (inst) {
    var key = inst.instanceDate.split('T')[0];
    if (!instancesByDate[key]) instancesByDate[key] = [];
    instancesByDate[key].push(inst);
  });

  // Build the calendar grid: leading nulls for days before the 1st, then 1..N
  var firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun
  var daysInMonth = new Date(year, month + 1, 0).getDate();
  var cells = [];
  for (var i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (var d = 1; d <= daysInMonth; d++) cells.push(d);

  // Chunk into rows of 7
  var weeks = [];
  for (var w = 0; w < cells.length; w += 7) weeks.push(cells.slice(w, w + 7));

  var todayKey = today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0');

  var selectedKey = selectedDay
    ? year + '-' + String(month + 1).padStart(2, '0') + '-' + String(selectedDay).padStart(2, '0')
    : null;
  var selectedInstances = selectedKey ? (instancesByDate[selectedKey] || []) : [];

  // ---- Sub-view: Edit Instance ----
  if (editingInstance) {
    return (
      <InstanceForm
        instance={editingInstance}
        seriesList={seriesList}
        instructors={instructorList}
        onSave={function () {
          setEditingInstance(null);
          loadCalendar(year, month);
        }}
        onCancel={function () { setEditingInstance(null); }}
      />
    );
  }

  // ---- Sub-view: Edit Series ----
  if (editingSeries) {
    return (
      <SeriesEditForm
        series={editingSeries}
        instructors={instructorList}
        onSave={function () {
          setEditingSeries(null);
          // Refresh series list and calendar
          SchedulingAPI.getAllClassSeries().then(function (s) { setSeriesList(s); }).catch(function () {});
          loadCalendar(year, month);
        }}
        onCancel={function () { setEditingSeries(null); }}
      />
    );
  }

  return (
    <div className="card">
      {/* Month navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <button onClick={prevMonth} style={{ flex: 'unset' }}>{'<< Prev'}</button>
        <h2 style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>
          {MONTH_NAMES[month]} {year}
        </h2>
        <button onClick={nextMonth} style={{ flex: 'unset' }}>{'Next >>'}</button>
      </div>

      {user.role === 'instructor' && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={function () { setViewMode('mine'); }}
              style={{
                flex: 'unset',
                fontWeight: viewMode === 'mine' ? '700' : '400',
                borderBottom: viewMode === 'mine' ? '3px solid #000' : '3px solid transparent',
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0
              }}
            >
              My Classes
            </button>
            <button
              type="button"
              onClick={function () { setViewMode('all'); }}
              style={{
                flex: 'unset',
                fontWeight: viewMode === 'all' ? '700' : '400',
                borderBottom: viewMode === 'all' ? '3px solid #000' : '3px solid transparent',
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0
              }}
            >
              Full Schedule
            </button>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '0.9rem', color: '#555' }}>
            {viewMode === 'mine' ? 'Showing classes assigned to you.' : 'Showing all scheduled classes.'}
          </p>
        </div>
      )}

      {isLoading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!isLoading && (
        <table style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr>
              {DAY_HEADERS.map(function (h) {
                return <th key={h} style={{ textAlign: 'center', padding: '6px 4px' }}>{h}</th>;
              })}
            </tr>
          </thead>
          <tbody>
            {weeks.map(function (week, wi) {
              // Pad last row to 7 cells
              var padded = week.concat(Array(7 - week.length).fill(null));
              return (
                <tr key={wi}>
                  {padded.map(function (day, di) {
                    var dateKey = day
                      ? year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0')
                      : null;
                    var dayInstances = dateKey ? (instancesByDate[dateKey] || []) : [];
                    var isToday = dateKey === todayKey;
                    var isSelected = dateKey === selectedKey;

                    return (
                      <td
                        key={di}
                        onClick={function () { if (day) setSelectedDay(day); }}
                        style={{
                          height: '80px',
                          verticalAlign: 'top',
                          padding: '4px',
                          cursor: day ? 'pointer' : 'default',
                          background: isToday ? '#fffbcc' : (isSelected ? '#f5f5f5' : 'transparent')
                        }}
                      >
                        {day && (
                          <>
                            <div style={{
                              display: 'inline-block',
                              fontWeight: '700',
                              fontSize: '0.9rem',
                              marginBottom: '2px',
                              background: isToday ? '#000' : 'transparent',
                              color: isToday ? '#fff' : '#000',
                              borderRadius: '50%',
                              width: '20px',
                              height: '20px',
                              lineHeight: '20px',
                              textAlign: 'center'
                            }}>
                              {day}
                            </div>
                            {dayInstances.slice(0, 2).map(function (inst) {
                              return (
                                <div
                                  key={inst.instanceId}
                                  style={{
                                    fontSize: '0.7rem',
                                    borderLeft: '2px solid #000',
                                    paddingLeft: '3px',
                                    marginBottom: '2px',
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap',
                                    textOverflow: 'ellipsis'
                                  }}
                                >
                                  {YogiUtils.formatTime(inst.startTime)} {inst.className}
                                </div>
                              );
                            })}
                            {dayInstances.length > 2 && (
                              <div style={{ fontSize: '0.7rem', color: '#555' }}>
                                +{dayInstances.length - 2} more
                              </div>
                            )}
                          </>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Day detail panel */}
      {selectedDay && (
        <div style={{ marginTop: '20px', borderTop: '1px solid #000', paddingTop: '16px' }}>
          <h3 style={{ marginBottom: '12px' }}>
            {MONTH_NAMES[month]} {selectedDay}, {year}
          </h3>
          {selectedInstances.length === 0 ? (
            <p>No classes scheduled.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Time</th>
                  <th>Duration</th>
                  <th>Status</th>
                  {user.role === 'manager' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {selectedInstances.map(function (inst) {
                  var instSeries = seriesList.find(function (s) { return s.classId === inst.classId; });
                  return (
                    <tr key={inst.instanceId}>
                      <td>{inst.className}</td>
                      <td>{YogiUtils.formatTime(inst.startTime)}</td>
                      <td>{YogiUtils.formatDuration(inst.duration)}</td>
                      <td>{inst.status}</td>
                      {user.role === 'manager' && (
                        <td>
                          {inst.status === 'scheduled' && (
                            <button
                              className="link-button"
                              onClick={function () { setEditingInstance(inst); }}
                            >
                              Edit Instance
                            </button>
                          )}
                          {inst.status === 'scheduled' && instSeries && ' · '}
                          {instSeries && (
                            <button
                              className="link-button"
                              onClick={function () { setEditingSeries(instSeries); }}
                            >
                              Edit Series
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
