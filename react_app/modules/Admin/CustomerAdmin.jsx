// CustomerAdmin - Manager tab for viewing and adding customer records.
// Customers are studio members; they do not have login accounts.

function CustomerAdmin() {
  var [customers, setCustomers] = React.useState([]);
  var [isLoading, setIsLoading] = React.useState(true);
  var [error, setError] = React.useState('');
  var [showForm, setShowForm] = React.useState(false);
  var [formData, setFormData] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    preferredContactMethod: 'email'
  });
  var [isSubmitting, setIsSubmitting] = React.useState(false);
  var [formError, setFormError] = React.useState('');
  var [formSuccess, setFormSuccess] = React.useState('');

  React.useEffect(function () {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    setIsLoading(true);
    setError('');
    try {
      var results = await CustomerAPI.getAllCustomers();
      setCustomers(results);
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
    try {
      await CustomerAPI.addCustomer(formData);
      setFormSuccess(formData.firstName + ' ' + formData.lastName + ' added as customer.');
      setFormData({ firstName: '', lastName: '', email: '', phone: '', address: '', dateOfBirth: '', preferredContactMethod: 'email' });
      setShowForm(false);
      loadCustomers();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="card">
      <h2>Customers</h2>

      {isLoading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {formSuccess && <p style={{ color: 'green', marginBottom: '12px' }}>{formSuccess}</p>}

      {!showForm && (
        <button
          onClick={function () { setShowForm(true); setFormSuccess(''); }}
          style={{ flex: 'unset', marginBottom: '16px' }}
        >
          + Add Customer
        </button>
      )}

      {showForm && (
        <div style={{ border: '1px solid #000', padding: '16px', marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '8px' }}>New Customer</h3>
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
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={function (e) { handleChange('email', e.target.value); }}
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
              <div className="form-group" style={{ flex: 2, minWidth: '200px' }}>
                <label>Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={function (e) { handleChange('address', e.target.value); }}
                />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: '160px' }}>
                <label>Date of Birth</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={function (e) { handleChange('dateOfBirth', e.target.value); }}
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
                {isSubmitting ? 'Adding...' : 'Add Customer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {!isLoading && customers.length === 0 && !error && <p>No customer records found.</p>}

      {!isLoading && customers.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Class Balance</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(function (c) {
              return (
                <tr key={c.customerId}>
                  <td>{c.firstName} {c.lastName}</td>
                  <td>{c.email || '—'}</td>
                  <td>{c.phone || '—'}</td>
                  <td>{c.classBalance}</td>
                  <td>{c.isActive ? 'Active' : 'Inactive'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
