// InstructorAdmin - Manager tab for viewing all instructors and creating new instructor records.
// Adding an instructor automatically creates a login account with a temporary password.

function InstructorAdmin() {
  var [instructors, setInstructors] = React.useState([]);
  var [isLoading, setIsLoading] = React.useState(true);
  var [error, setError] = React.useState('');
  var [showAddForm, setShowAddForm] = React.useState(false);
  var [editingInstructor, setEditingInstructor] = React.useState(null);
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
  var [tempCredentials, setTempCredentials] = React.useState(null);
  var [pendingConfirm, setPendingConfirm] = React.useState(null);

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

  function openAddForm() {
    setEditingInstructor(null);
    setFormData({ firstName: '', lastName: '', email: '', username: '', phone: '', preferredContactMethod: 'email' });
    setFormError('');
    setPendingConfirm(null);
    setFormSuccess('');
    setTempCredentials(null);
    setShowAddForm(true);
  }

  function openEditForm(instructor) {
    setShowAddForm(false);
    setEditingInstructor(instructor);
    setFormData({
      firstName: instructor.firstName,
      lastName: instructor.lastName,
      email: instructor.email,
      phone: instructor.phone || '',
      preferredContactMethod: instructor.preferredContactMethod || 'email'
    });
    setFormError('');
    setPendingConfirm(null);
    setFormSuccess('');
    setTempCredentials(null);
  }

  function closeForm() {
    setShowAddForm(false);
    setEditingInstructor(null);
    setFormError('');
    setPendingConfirm(null);
  }

  async function handleSubmit(e, confirmedData) {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setFormError('');
    setPendingConfirm(null);
    var data = confirmedData || formData;
    try {
      if (editingInstructor) {
        await SchedulingAPI.updateInstructor(editingInstructor.instructorId, data);
        setFormSuccess(data.firstName + ' ' + data.lastName + ' updated.');
        setEditingInstructor(null);
      } else {
        var results = await SchedulingAPI.addInstructor(data);
        var created = results[0];
        var tu = created && created.tempUsername ? created.tempUsername : null;
        var tp = created && created.tempPassword ? created.tempPassword : null;
        setTempCredentials(tu || tp ? { username: tu, password: tp } : null);
        setFormSuccess(data.firstName + ' ' + data.lastName + ' added as instructor.');
        setFormData({ firstName: '', lastName: '', email: '', username: '', phone: '', preferredContactMethod: 'email' });
        setShowAddForm(false);
      }
      loadInstructors();
    } catch (err) {
      if (err.isConfirmation) {
        setPendingConfirm({ message: err.message, confirmText: err.confirmText });
      } else {
        setFormError(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(instructor) {
    if (!window.confirm('Remove ' + instructor.firstName + ' ' + instructor.lastName + '? If they have class assignments they will be deactivated instead of deleted.')) return;
    try {
      await SchedulingAPI.deleteInstructor(instructor.instructorId);
      setFormSuccess(instructor.firstName + ' ' + instructor.lastName + ' removed.');
      if (editingInstructor && editingInstructor.instructorId === instructor.instructorId) closeForm();
      loadInstructors();
    } catch (err) {
      setError(err.message);
    }
  }

  var showForm = showAddForm || !!editingInstructor;
  var formTitle = editingInstructor ? 'Edit Instructor' : 'New Instructor';

  return (
    <div className="card">
      <h2>Instructors</h2>

      {isLoading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {formSuccess && (
        <div style={{ border: '2px solid green', padding: '12px', marginBottom: '16px', background: '#f0fff0' }}>
          <p style={{ color: 'green', margin: 0 }}>{formSuccess}</p>
          {tempCredentials && tempCredentials.username && (
            <p style={{ margin: '8px 0 0', fontFamily: 'monospace', fontSize: '1rem' }}>
              Username: <strong>{tempCredentials.username}</strong>
            </p>
          )}
          {tempCredentials && tempCredentials.password && (
            <p style={{ margin: '4px 0 0', fontFamily: 'monospace', fontSize: '1rem' }}>
              Temporary password: <strong>{tempCredentials.password}</strong>
              <span style={{ marginLeft: '12px', color: '#555', fontSize: '0.85rem' }}>- share these with the instructor; they will be prompted to change their password on first login</span>
            </p>
          )}
        </div>
      )}

      {!showForm && (
        <button
          onClick={openAddForm}
          style={{ flex: 'unset', marginBottom: '16px' }}
        >
          + Add Instructor
        </button>
      )}

      {showForm && (
        <div style={{ border: '1px solid #000', padding: '16px', marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '8px' }}>{formTitle}</h3>
          {!editingInstructor && (
            <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: '12px' }}>
              A login account will be created automatically. Leave Username blank to auto-generate it from the instructor's name.
            </p>
          )}
          {formError && <p style={{ color: 'red', marginBottom: '12px' }}>{formError}</p>}
          {pendingConfirm && (
            <div style={{ border: '1px solid #888', padding: '10px', marginBottom: '12px', background: '#fffbe6' }}>
              <p style={{ margin: '0 0 8px' }}>{pendingConfirm.message}</p>
              <button
                type="button"
                onClick={function () { handleSubmit(null, Object.assign({}, formData, { confirmDuplicate: 'true' })); }}
                disabled={isSubmitting}
                style={{ marginRight: '8px' }}
              >
                {pendingConfirm.confirmText || 'Yes, Confirm'}
              </button>
              <button type="button" onClick={closeForm}>Cancel</button>
            </div>
          )}
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
              {!editingInstructor && (
                <div className="form-group" style={{ flex: 1, minWidth: '160px' }}>
                  <label>Username <span style={{ color: '#888', fontWeight: 'normal' }}>(optional)</span></label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={function (e) { handleChange('username', e.target.value); }}
                    placeholder="Auto-generated from name"
                  />
                </div>
              )}
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
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button type="button" onClick={closeForm}>Cancel</button>
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (editingInstructor ? 'Saving...' : 'Adding...') : (editingInstructor ? 'Save Changes' : 'Add Instructor')}
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {instructors.map(function (i) {
              return (
                <tr key={i.instructorId} style={{ background: editingInstructor && editingInstructor.instructorId === i.instructorId ? '#f5f5f5' : '' }}>
                  <td>{i.firstName} {i.lastName}</td>
                  <td>{i.email}</td>
                  <td>{i.phone || '-'}</td>
                  <td>{i.preferredContactMethod}</td>
                  <td>{i.isActive ? 'Active' : 'Inactive'}</td>
                  <td>
                    <button className="link-button" onClick={function () { openEditForm(i); }}>Edit</button>
                    {' | '}
                    <button className="link-button" onClick={function () { handleDelete(i); }}>Delete</button>
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
