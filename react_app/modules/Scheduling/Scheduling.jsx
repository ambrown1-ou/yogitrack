// Scheduling - Main module for managers to manage class series, instances, and instructors.
// Three tabs: Class Series | Instances | Instructors

function Scheduling({ user }) {
  var [activeTab, setActiveTab] = React.useState('series');
  var [seriesList, setSeriesList] = React.useState([]);
  var [instructorList, setInstructorList] = React.useState([]);
  var [instances, setInstances] = React.useState([]);
  var [filterClassId, setFilterClassId] = React.useState('');
  var [isLoading, setIsLoading] = React.useState(true);
  var [error, setError] = React.useState('');

  // Form visibility state
  var [showClassForm, setShowClassForm] = React.useState(false);
  var [showInstanceForm, setShowInstanceForm] = React.useState(false);
  var [editingInstance, setEditingInstance] = React.useState(null);
  var [showSeriesEditForm, setShowSeriesEditForm] = React.useState(false);
  var [editingSeries, setEditingSeries] = React.useState(null);
  var [seriesPageSize, setSeriesPageSize] = React.useState(25);
  var [seriesPage, setSeriesPage] = React.useState(1);
  var [instPageSize, setInstPageSize] = React.useState(25);
  var [instPage, setInstPage] = React.useState(1);

  React.useEffect(function () {
    loadData();
  }, []);

  // Load all class series and the instructor list on mount; both are needed across tabs
  async function loadData() {
    setIsLoading(true);
    setError('');
    try {
      var results = await Promise.all([
        SchedulingAPI.getAllClassSeries(),
        SchedulingAPI.getAllInstructors()
      ]);
      setSeriesList(results[0]);
      setInstructorList(results[1]);
    } catch (err) {
      setError(err.status ? err.message : 'Could not load scheduling data. Please refresh and try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // Load upcoming instances (next 90 days) for the selected class series
  async function loadInstances(classId) {
    if (!classId) { setInstances([]); return; }
    setInstPage(1);
    var today = YogiUtils.todayStr();
    var endDate = YogiUtils.futureDateStr(90);
    try {
      var results = await SchedulingAPI.getClassInstances(classId, today, endDate);
      setInstances(results);
    } catch (err) {
      setInstances([]);
    }
  }

  // Soft-delete the series and cancel all future instances; prompts for confirmation first
  async function handleDeactivateSeries(classId, className) {
    if (!window.confirm('Deactivate "' + className + '" and cancel all future instances?')) return;
    try {
      await SchedulingAPI.deleteClassSeries(classId);
      loadData();
      setInstances([]);
      setFilterClassId('');
    } catch (err) {
      window.alert(err.status ? err.message : 'Something went wrong. Please try again.');
    }
  }

  // Cancel a single class instance; prompts for confirmation first
  async function handleCancelInstance(instanceId) {
    if (!window.confirm('Cancel this class instance?')) return;
    try {
      await SchedulingAPI.cancelClassInstance(instanceId);
      loadInstances(filterClassId);
    } catch (err) {
      window.alert(err.status ? err.message : 'Something went wrong. Please try again.');
    }
  }

  // Resolve instructor full name from instructorId for table display
  function getInstructorName(instructorId) {
    var found = instructorList.find(function (i) { return i.instructorId === instructorId; });
    return found ? found.firstName + ' ' + found.lastName : instructorId;
  }

  // ---- Sub-view: SeriesEditForm ----
  if (showSeriesEditForm && editingSeries) {
    return (
      <SeriesEditForm
        series={editingSeries}
        instructors={instructorList}
        onSave={function () { setShowSeriesEditForm(false); setEditingSeries(null); loadData(); }}
        onCancel={function () { setShowSeriesEditForm(false); setEditingSeries(null); }}
      />
    );
  }

  // ---- Sub-view: ClassForm ----
  if (showClassForm) {
    return (
      <ClassForm
        instructors={instructorList}
        onSave={function () { setShowClassForm(false); loadData(); }}
        onCancel={function () { setShowClassForm(false); }}
      />
    );
  }

  // ---- Sub-view: InstanceForm ----
  if (showInstanceForm && editingInstance) {
    return (
      <InstanceForm
        instance={editingInstance}
        seriesList={seriesList}
        instructors={instructorList}
        onSave={function () {
          setShowInstanceForm(false);
          setEditingInstance(null);
          loadInstances(filterClassId);
        }}
        onCancel={function () {
          setShowInstanceForm(false);
          setEditingInstance(null);
        }}
      />
    );
  }

  var pagedSeries = YogiUtils.paginateControls(seriesList, seriesPageSize, seriesPage, setSeriesPageSize, setSeriesPage);
  var pagedInstances = YogiUtils.paginateControls(instances, instPageSize, instPage, setInstPageSize, setInstPage);

  // ---- Main scheduling view ----
  return (
    <div className="card">
      <h2>Scheduling</h2>

      {isLoading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!isLoading && (
        <>
          {/* Tab navigation */}
          <div className="scheduling-subtabs" style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid #000', paddingBottom: '0' }}>
            {[['series', 'Class Series'], ['instances', 'Instances']].map(function (tab) {
              return (
                <button
                  className="subtab-button"
                  key={tab[0]}
                  onClick={function () { setActiveTab(tab[0]); }}
                  style={{
                    flex: 'unset',
                    border: '1px solid #000',
                    borderBottom: activeTab === tab[0] ? '1px solid #fff' : '1px solid #000',
                    fontWeight: activeTab === tab[0] ? '700' : '400',
                    marginBottom: '-1px',
                    background: activeTab === tab[0] ? '#fff' : 'transparent'
                  }}
                >
                  {tab[1]}
                </button>
              );
            })}
          </div>

          {/* ---- Class Series Tab ---- */}
          {activeTab === 'series' && (
            <div>
              {user.role !== 'instructor' && (
                <button
                  onClick={function () { setShowClassForm(true); }}
                  style={{ flex: 'unset', marginBottom: '16px' }}
                >
                  + New Class Series
                </button>
              )}

              {pagedSeries.controls}
              {seriesList.length === 0 ? (
                <p>No class series found. Create one to get started.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Days</th>
                      <th>Time</th>
                      <th>Duration</th>
                      <th>Dates</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedSeries.visibleItems.map(function (s) {
                      return (
                        <tr key={s.classId}>
                          <td>{s.className}</td>
                          <td>{s.classType}</td>
                          <td>{s.daysOfWeek.map(function (d) { return d.slice(0, 3); }).join(', ')}</td>
                          <td>{YogiUtils.formatTime(s.startTime)}</td>
                          <td>{s.duration}</td>
                          <td>{s.startDate} to {s.endDate}</td>
                          <td>
                            <button
                              className="link-button"
                              onClick={function () {
                                setFilterClassId(s.classId);
                                loadInstances(s.classId);
                                setActiveTab('instances');
                              }}
                            >
                              Instances
                            </button>
                            {user.role !== 'instructor' && (
                              <>
                                {' | '}
                                <button
                                  className="link-button"
                                  onClick={function () { setEditingSeries(s); setShowSeriesEditForm(true); }}
                                >
                                  Edit
                                </button>
                                {' | '}
                                <button
                                  className="link-button"
                                  onClick={function () { handleDeactivateSeries(s.classId, s.className); }}
                                >
                                  Deactivate
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ---- Instances Tab ---- */}
          {activeTab === 'instances' && (
            <div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '16px', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0, minWidth: '200px' }}>
                  <label>Class Series</label>
                  <select
                    value={filterClassId}
                    onChange={function (e) {
                      setFilterClassId(e.target.value);
                      loadInstances(e.target.value);
                    }}
                  >
                    <option value="">-- Select a class --</option>
                    {seriesList.map(function (s) {
                      return <option key={s.classId} value={s.classId}>{s.className}</option>;
                    })}
                  </select>
                </div>
              </div>

              {!filterClassId && <p>Select a class series to view its upcoming instances.</p>}
              {filterClassId && instances.length === 0 && <p>No upcoming instances found for this class.</p>}
              {instances.length > 0 && pagedInstances.controls}
              {instances.length > 0 && (
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Duration</th>
                      <th>Instructor</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedInstances.visibleItems.map(function (inst) {
                      return (
                        <tr key={inst.instanceId}>
                          <td>{YogiUtils.formatDate(inst.instanceDate)}</td>
                          <td>{YogiUtils.formatTime(inst.startTime)}</td>
                          <td>{inst.duration}</td>
                          <td>{getInstructorName(inst.instructorId)}</td>
                          <td>{inst.status}</td>
                          <td>
                            {inst.status === 'scheduled' && user.role !== 'instructor' && (
                              <>
                                <button
                                  className="link-button"
                                  onClick={function () {
                                    setEditingInstance(inst);
                                    setShowInstanceForm(true);
                                  }}
                                >
                                  Edit
                                </button>
                                {' | '}
                                <button
                                  className="link-button"
                                  onClick={function () { handleCancelInstance(inst.instanceId); }}
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

        </>
      )}
    </div>
  );
}
