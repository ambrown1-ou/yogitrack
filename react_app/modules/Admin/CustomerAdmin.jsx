// CustomerAdmin - Manager tab for viewing and adding customer records.
// Customers are studio members; they do not have login accounts.

function CustomerAdmin() {
  var [customers, setCustomers] = React.useState([]);
  var [isLoading, setIsLoading] = React.useState(true);
  var [error, setError] = React.useState('');
  var [showAddForm, setShowAddForm] = React.useState(false);
  var [editingCustomer, setEditingCustomer] = React.useState(null);
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
  var [pendingConfirm, setPendingConfirm] = React.useState(null);

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

  function openAddForm() {
    setEditingCustomer(null);
    setFormData({ firstName: '', lastName: '', email: '', phone: '', address: '', dateOfBirth: '', preferredContactMethod: 'email' });
    setFormError('');
    setPendingConfirm(null);
    setFormSuccess('');
    setShowAddForm(true);
  }

  function openEditForm(customer) {
    setShowAddForm(false);
    setEditingCustomer(customer);
    setFormData({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      dateOfBirth: customer.dateOfBirth || '',
      preferredContactMethod: customer.preferredContactMethod || 'email'
    });
    setFormError('');
    setPendingConfirm(null);
    setFormSuccess('');
  }

  function closeForm() {
    setShowAddForm(false);
    setEditingCustomer(null);
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
      if (editingCustomer) {
        await CustomerAPI.updateCustomer(editingCustomer.customerId, data);
        setFormSuccess(data.firstName + ' ' + data.lastName + ' updated.');
        setEditingCustomer(null);
      } else {
        await CustomerAPI.addCustomer(data);
        setFormSuccess(data.firstName + ' ' + data.lastName + ' added as customer.');
        setFormData({ firstName: '', lastName: '', email: '', phone: '', address: '', dateOfBirth: '', preferredContactMethod: 'email' });
        setShowAddForm(false);
      }
      loadCustomers();
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

  async function handleDelete(customer) {
    if (!window.confirm('Remove ' + customer.firstName + ' ' + customer.lastName + '? If they have sales or attendance records they will be deactivated instead of deleted.')) return;
    try {
      await CustomerAPI.deleteCustomer(customer.customerId);
      setFormSuccess(customer.firstName + ' ' + customer.lastName + ' removed.');
      if (editingCustomer && editingCustomer.customerId === customer.customerId) closeForm();
      loadCustomers();
    } catch (err) {
      setError(err.message);
    }
  }

  var showForm = showAddForm || !!editingCustomer;
  var formTitle = editingCustomer ? 'Edit Customer' : 'New Customer';

  return (
    <div className="card">
      <h2>Customers</h2>

      {isLoading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {formSuccess && <p style={{ color: 'green', marginBottom: '12px' }}>{formSuccess}</p>}

      {!showForm && (
        <button
          onClick={openAddForm}
          style={{ flex: 'unset', marginBottom: '16px' }}
        >
          + Add Customer
        </button>
      )}

      {showForm && (
        <div style={{ border: '1px solid #000', padding: '16px', marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '8px' }}>{formTitle}</h3>
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
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button type="button" onClick={closeForm}>Cancel</button>
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (editingCustomer ? 'Saving...' : 'Adding...') : (editingCustomer ? 'Save Changes' : 'Add Customer')}
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(function (c) {
              return (
                <tr key={c.customerId} style={{ background: editingCustomer && editingCustomer.customerId === c.customerId ? '#f5f5f5' : '' }}>
                  <td>{c.firstName} {c.lastName}</td>
                  <td>{c.email || '-'}</td>
                  <td>{c.phone || '-'}</td>
                  <td>{c.classBalance}</td>
                  <td>{c.isActive ? 'Active' : 'Inactive'}</td>
                  <td>
                    <button className="link-button" onClick={function () { openEditForm(c); }}>Edit</button>
                    {' | '}
                    <button className="link-button" onClick={function () { handleDelete(c); }}>Delete</button>
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
