const { useState } = React;

// Login component - Displays login form and sends credentials to backend
function Login({ onLoginSuccess, isLoading, error }) {
  // State for form inputs
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('manager');

  // handleSubmit - Called when form is submitted
  // Sends username, password, and role to /api/user/login endpoint
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
      username: username.trim(),
      password: password,
      role: role
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

      // If login successful, call parent callback and clear form
      if (data.success) {
        onLoginSuccess(payload);
        setUsername('');
        setPassword('');
      } else {
        // Show error message from response
        const errorMessage = data.results[0] ? data.results[0].error : 'Unknown error';
        alert('Login failed: ' + errorMessage);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="container narrow">
      <div className="card">
        <h1>YogiTrack</h1>
        <p>Studio Management System</p>

        {error && <p style={{ color: 'red', marginBottom: '16px' }}>{error}</p>}

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
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>

          {/* Role selector dropdown */}
          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={isLoading}
            >
              <option value="manager">Manager</option>
              <option value="instructor">Instructor</option>
            </select>
          </div>

          {/* Submit button */}
          <div className="form-actions">
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>

        <p style={{ marginTop: '16px', fontSize: '0.9em', color: '#666' }}>
          Test accounts available with TEST_MANAGER_USERNAME and TEST_INSTRUCTOR_USERNAME environment variables
        </p>
      </div>
    </div>
  );
}

// Dashboard component - Shows after successful login
function Dashboard({ user, onLogout }) {
  return (
    <div className="container">
      <div className="header">
        <h1>Welcome, {user.username}</h1>
        <p>Role: {user.role}</p>
      </div>

      <div className="card">
        <h2>Dashboard</h2>
        <p>You are now logged in. More features coming soon.</p>
        <button onClick={onLogout}>
          Logout
        </button>
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
  
  // Track if login is in progress
  const [isLoading, setIsLoading] = useState(false);
  
  // Store any error messages
  const [error, setError] = useState('');

  // handleLoginSuccess - Called when user successfully logs in
  // Stores user data and shows dashboard
  const handleLoginSuccess = (loginData) => {
    setUser(loginData);
    setIsLoggedIn(true);
    setError('');
    alert('Welcome ' + loginData.username + '!');
  };

  // handleLogout - Called when user clicks logout button
  // Clears user data and returns to login screen
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
  };

  // Show login form if not logged in, otherwise show dashboard
  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} isLoading={isLoading} error={error} />;
  }

  return <Dashboard user={user} onLogout={handleLogout} />;
}

// Render the app into the root div
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
