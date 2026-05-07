const { useState, useEffect } = React;

// RolePicker - Shown when a manager user also has an instructor record.
// Lets them choose whether to use the app as manager or instructor for this session.
function RolePicker({ user, onPick }) {
  return (
    <div className="container narrow">
      <div className="card">
        <h1>YogiTrack</h1>
        <p style={{ marginBottom: '24px' }}>
          Welcome back, <strong>{user.username}</strong>. Your account has both manager and
          instructor access. How would you like to view the app today?
        </p>
        <div className="form-actions">
          <button onClick={() => onPick('manager')}>View as Manager</button>
          <button onClick={() => onPick('instructor')}>View as Instructor</button>
        </div>
      </div>
    </div>
  );
}

// Login component - Displays login form and sends credentials to backend
function Login({ onLoginSuccess, error }) {
  // State for form inputs
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  // Track submission in progress and any login error
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');

  // handleSubmit - Called when form is submitted
  // Sends username and password to /api/user/login endpoint
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoginError('');

    const payload = {
      username: username.trim(),
      password: password
    };

    try {
      const response = await fetch('/api/user/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      // If login successful, fetch full user data and show dashboard
      if (data.success) {
        // Get full user data including role from getCurrentUser
        const userResponse = await fetch('/api/user/getCurrentUser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const userData = await userResponse.json();
        
        if (userData.success && userData.results[0]) {
          onLoginSuccess(userData.results[0]);
        }
        setUsername('');
        setPassword('');
      } else {
        // Show error message from response
        const errorMessage = data.results[0] ? data.results[0].error : 'Unknown error';
        console.error('Login failed:', errorMessage);
        setLoginError('Login failed: ' + errorMessage);
      }
    } catch (err) {
      console.error('Login error:', err.message);
      setLoginError('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container narrow">
      <div className="card">
        <h1>YogiTrack</h1>
        <p>Studio Management System</p>

        {(error || loginError) && <p style={{ color: 'red', marginBottom: '16px' }}>{loginError || error}</p>}

        <form onSubmit={handleSubmit}>
          {/* Username input field */}
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Password input field */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Submit button */}
          <div className="form-actions">
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Dashboard - Passes through to AppRouter with the effective view role.
function Dashboard({ user, onLogout, viewRole, onSwitchRole }) {
  const effectiveUser = Object.assign({}, user, { role: viewRole });
  return <AppRouter user={effectiveUser} onLogout={onLogout} onSwitchRole={onSwitchRole} />;
}

// ChangePassword - Shown on first login (temp password). Forces the user to set a real password.
function ChangePassword({ user, onComplete }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setIsSubmitting(true);
    try {
      const results = await UserAPI.changePassword(newPassword);
      onComplete(results[0]);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container narrow">
      <div className="card">
        <h1>YogiTrack</h1>
        <p style={{ marginBottom: '8px' }}>Welcome, <strong>{user.username}</strong>!</p>
        <p style={{ marginBottom: '24px', color: '#555' }}>
          You are logged in with a temporary password. Please set a new password before continuing.
        </p>
        {error && <p style={{ color: 'red', marginBottom: '12px' }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="form-actions">
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Set Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// App component - Main component that manages login state
function App() {
  // Track if user is logged in
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Store logged-in user data
  const [user, setUser] = useState(null);
  
  // Store any error messages
  const [error, setError] = useState('');

  // Dual-role state: viewRole is null until resolved by checkDualRole
  const [viewRole, setViewRole] = useState(null);
  const [hasInstructorRecord, setHasInstructorRecord] = useState(false);
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);

  // If the user is a manager, check whether they also have an instructor record.
  // Sets viewRole directly for non-managers; leaves it null (shows RolePicker) for dual-role managers.
  const checkDualRole = async (userObj) => {
    if (userObj.role === 'manager') {
      try {
        const record = await AttendanceAPI.getInstructorRecord(userObj.email);
        if (record) {
          setHasInstructorRecord(true);
          return; // viewRole stays null → RolePicker will appear
        }
      } catch (err) {
        // If the check fails, fall through and treat as a normal manager
      }
    }
    setViewRole(userObj.role);
  };

  // Check if user is already logged in when component mounts
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/user/getCurrentUser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        
        if (data.success && data.results[0]) {
          const sessionUser = data.results[0];
          setUser(sessionUser);
          setIsLoggedIn(true);
          if (!sessionUser.lastLogin) {
            setNeedsPasswordChange(true);
          } else {
            await checkDualRole(sessionUser);
          }
        }
      } catch (err) {
        // No session or error checking session - user stays on login
      }
    };
    checkSession();
  }, []);

  // handleLoginSuccess - Called when user successfully logs in
  const handleLoginSuccess = async (loginData) => {
    setUser(loginData);
    setIsLoggedIn(true);
    setError('');
    if (!loginData.lastLogin) {
      setNeedsPasswordChange(true);
    } else {
      await checkDualRole(loginData);
    }
  };

  // handleLogout - Called when user clicks logout button
  const handleLogout = async () => {
    try {
      await fetch('/api/user/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      // Ignore logout errors
    }
    setIsLoggedIn(false);
    setUser(null);
    setViewRole(null);
    setHasInstructorRecord(false);
    setNeedsPasswordChange(false);
  };

  // Show login form if not logged in
  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} error={error} />;
  }

  // First login: force password change before proceeding
  if (needsPasswordChange) {
    return <ChangePassword user={user} onComplete={function (updatedUser) {
      setUser(updatedUser);
      setNeedsPasswordChange(false);
      checkDualRole(updatedUser);
    }} />;
  }

  // Manager with instructor record: show role picker until a choice is made
  if (viewRole === null && hasInstructorRecord) {
    return <RolePicker user={user} onPick={setViewRole} />;
  }

  // viewRole may briefly be null while checkDualRole is resolving
  if (viewRole === null) {
    return null;
  }

  return (
    <Dashboard
      user={user}
      onLogout={handleLogout}
      viewRole={viewRole}
      onSwitchRole={hasInstructorRecord ? () => setViewRole(null) : null}
    />
  );
}

// Render the app into the root div
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
