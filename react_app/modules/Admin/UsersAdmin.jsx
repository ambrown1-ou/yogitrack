// UsersAdmin - Manager tab for viewing all user accounts (read-only).
// Users are created automatically when adding an instructor, or by registering directly.

function UsersAdmin() {
  var [users, setUsers] = React.useState([]);
  var [isLoading, setIsLoading] = React.useState(true);
  var [error, setError] = React.useState('');

  React.useEffect(function () {
    loadUsers();
  }, []);

  async function loadUsers() {
    setIsLoading(true);
    setError('');
    try {
      var results = await UserAPI.getAllUsers();
      setUsers(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>Users</h2>
      <p style={{ color: '#555', marginBottom: '16px', fontSize: '0.9rem' }}>
        Instructor accounts are created automatically when adding an instructor. Manager accounts must be registered directly via the backend.
      </p>

      {isLoading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!isLoading && users.length === 0 && !error && <p>No users found.</p>}

      {!isLoading && users.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Email</th>
              <th>Last Login</th>
            </tr>
          </thead>
          <tbody>
            {users.map(function (u) {
              return (
                <tr key={u._id || u.username}>
                  <td>{u.username}</td>
                  <td>{u.role}</td>
                  <td>{u.email}</td>
                  <td>{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never (temp password)'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
