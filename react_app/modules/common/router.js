// AppRouter - Role-based top-level router rendered after login.
// Replaces the Dashboard placeholder in index.js.
// Managers see: Schedule + Calendar
// Instructors see: Attendance + Calendar
// Customers see: Calendar (read-only)

function AppRouter({ user, onLogout, onSwitchRole }) {
  var tabs;
  var defaultTab;

  if (user.role === 'manager') {
    tabs = [
      { id: 'schedule', label: 'Schedule' },
      { id: 'calendar', label: 'Calendar' },
      { id: 'customers', label: 'Customers' },
      { id: 'instructors', label: 'Instructors' }
    ];
    defaultTab = 'schedule';
  } else if (user.role === 'instructor') {
    tabs = [
      { id: 'attendance', label: 'Attendance' },
      { id: 'calendar', label: 'Calendar' }
    ];
    defaultTab = 'attendance';
  } else {
    tabs = [
      { id: 'calendar', label: 'Calendar' }
    ];
    defaultTab = 'calendar';
  }

  var [activeTab, setActiveTab] = React.useState(defaultTab);

  return (
    <div className="container">
      <div className="header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>YogiTrack</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.9rem' }}>
              {user.username} <span style={{ color: '#555' }}>({user.role})</span>
            </span>
            {onSwitchRole && (
              <button onClick={onSwitchRole} style={{ flex: 'unset' }}>Switch View</button>
            )}
            <button onClick={onLogout} style={{ flex: 'unset' }}>Logout</button>
          </div>
        </div>

        <nav style={{ display: 'flex', gap: '4px', marginTop: '16px' }}>
          {tabs.map(function (tab) {
            return (
              <button
                key={tab.id}
                onClick={function () { setActiveTab(tab.id); }}
                style={{
                  flex: 'unset',
                  fontWeight: activeTab === tab.id ? '700' : '400',
                  borderBottom: activeTab === tab.id ? '3px solid #000' : '3px solid transparent',
                  paddingBottom: '8px'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {activeTab === 'attendance' && <Attendance user={user} />}
      {activeTab === 'schedule' && <Scheduling user={user} />}
      {activeTab === 'calendar' && <Calendar user={user} />}
      {activeTab === 'customers' && <CustomerAdmin />}
      {activeTab === 'instructors' && <InstructorAdmin />}
    </div>
  );
}
