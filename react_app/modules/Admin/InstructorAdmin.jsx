// InstructorAdmin - Manager tab for viewing all instructors and creating new instructor records.
// Adding an instructor automatically creates a login account with a temporary password.

function InstructorAdmin() {
  var [instructors, setInstructors] = React.useState([]);
  var [isLoading, setIsLoading] = React.useState(true);
  var [error, setError] = React.useState('');
  var [showForm, setShowForm] = React.useState(false);
  var [formData, setFormData] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    phone: '',
    preferredContactMethod: 'email'
  });
  var [isSubmitting, setIsSubmitting] = React.useState(false);
  var [formError, setFormError] = React.useState('');
  var [formSuccess, setFormSuccess] = React.useState('');
  var [tempPassword, setTempPassword] = React.useState(null);

  React.useEffect(function () {
    loadInstructors();
  }, []);

  async function loadInstructors() {
    setIsLoading(true);
    setError('');
    try {
      var results = await SchedulingAPI.getAllInstructors();
      setInstructors(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleChange(field, value) {
    setFormData(function (prev) {
      return Object.assign({}, prev, { [field]: value });
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');
    setFormSuccess('');
    setTempPassword(null);
    try {
      var results = await SchedulingAPI.addInstructor(formData);
      var created = results[0];
      var tp = created && created.tempPassword ? created.tempPassword : null;
      setTempPassword(tp);
      setFormSuccess(formData.firstName + ' ' + formData.lastName + ' added as instructor.');
      setFormData({ firstName: '', lastName: '', email: '', username: '', phone: '', preferredContactMethod: 'email' });
      setShowForm(false);
      loadInstructors();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="card">
      <h2>Instructors</h2>

      {isLoading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {formSuccess && (
        <div style={{ border: '2px solid green', padding: '12px', marginBottom: '16px', background: '#f0fff0' }}>
          <p style={{ color: 'green', margin: 0 }}>{formSuccess}</p>
          {tempPassword && (
            <p style={{ margin: '8px 0 0', fontFamily: 'monospace', fontSize: '1rem' }}>
              Temporary password: <strong>{tempPassword}</strong>
              <span style={{ marginLeft: '12px', color: '#555', fontSize: '0.85rem' }}>- share this with the instructor; they will be prompted to change it on first login</span>
            </p>
          )}
        </div>
      )}

      {!showForm && (
        <button
          onClick={function () { setShowForm(true); setFormSuccess(''); }}
          style={{ flex: 'unset', marginBottom: '16px' }}
        >
          + Add Instructor
        </button>
      )}

      {showForm && (
        <div style={{ border: '1px solid #000', padding: '16px', marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '8px' }}>New Instructor</h3>
          <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: '12px' }}>
            A login account will be created automatically. Leave Username blank to auto-generate it from the instructor's name.
          </p>
          {formError && <p style={{ color: 'red', marginBottom: '12px' }}>{formError}</p>}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: '160px' }}>
                <label>First Name *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={function (e) { handleChange('firstName', e.target.value); }}
                  required
                />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: '160px' }}>
                <label>Last Name *</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={function (e) { handleChange('lastName', e.target.value); }}
                  required
                />
              </div>
              <div className="form-group" style={{ flex: 2, minWidth: '200px' }}>
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={function (e) { handleChange('email', e.target.value); }}
                  required
                />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: '160px' }}>
                <label>Username <span style={{ color: '#888', fontWeight: 'normal' }}>(optional)</span></label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={function (e) { handleChange('username', e.target.value); }}
                  placeholder="Auto-generated from name"
                />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
                <label>Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={function (e) { handleChange('phone', e.target.value); }}
                />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: '160px' }}>
                <label>Preferred Contact</label>
                <select
                  value={formData.preferredContactMethod}
                  onChange={function (e) { handleChange('preferredContactMethod', e.target.value); }}
                >
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="text">Text</option>
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button type="button" onClick={function () { setShowForm(false); setFormError(''); }}>Cancel</button>
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Instructor'}
              </button>
            </div>
          </form>
        </div>
      )}

      {!isLoading && instructors.length === 0 && !error && <p>No instructor records found.</p>}

      {!isLoading && instructors.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Contact Pref.</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {instructors.map(function (i) {
              return (
                <tr key={i.instructorId}>
                  <td>{i.firstName} {i.lastName}</td>
                  <td>{i.email}</td>
                  <td>{i.phone || '-'}</td>
                  <td>{i.preferredContactMethod}</td>
                  <td>{i.isActive ? 'Active' : 'Inactive'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
