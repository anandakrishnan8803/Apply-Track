import { useEffect, useState } from 'react';
import Auth from './Auth';
import './App.css';

const API_URL = `${import.meta.env.VITE_API_URL}/api/applications`;

const emptyForm = {
  company: '',
  role: '',
  jobLink: '',
  status: 'Interested',
  notes: '',
};

function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activePage, setActivePage] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!token) {
      setApplications([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();

      if (search.trim()) params.set('search', search.trim());
      if (statusFilter) params.set('status', statusFilter);

      const queryString = params.toString();
      const url = queryString ? `${API_URL}?${queryString}` : API_URL;

      try {
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            response.status === 401
              ? 'Your session is invalid. Please sign in again.'
              : 'Could not load applications.'
          );
        }

        const data = await response.json();
        setApplications(data);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [token, search, statusFilter]);

  const interviewCount = applications.filter(
    (application) => application.status === 'Interview'
  ).length;

  const offerCount = applications.filter(
    (application) => application.status === 'Offer'
  ).length;

  const visibleApplications =
    activePage === 'dashboard' ? applications.slice(0, 5) : applications;

  function handleAuthenticated(newToken, newUser) {
    setToken(newToken);
    setUser(newUser);
    setError('');
  }

  function handleLogout() {
    setToken(null);
    setUser(null);
    setApplications([]);
    setSearch('');
    setStatusFilter('');
    setActivePage('dashboard');
    closeForm();
  }

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function openAddForm() {
    setForm(emptyForm);
    setEditingId(null);
    setFormError('');
    setShowForm(true);
  }

  function openEditForm(application) {
    setForm({
      company: application.company,
      role: application.role,
      jobLink: application.jobLink || '',
      status: application.status,
      notes: application.notes || '',
    });
    setEditingId(application._id);
    setFormError('');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
  }

  async function handleSaveApplication(event) {
    event.preventDefault();
    setSaving(true);
    setFormError('');

    const isEditing = Boolean(editingId);
    const url = isEditing ? `${API_URL}/${editingId}` : API_URL;

    try {
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not save application.');
      }

      if (isEditing) {
        setApplications((current) =>
          current.map((application) =>
            application._id === editingId ? data : application
          )
        );
      } else {
        setApplications((current) => [data, ...current]);
      }

      closeForm();
      setSearch('');
      setStatusFilter('');
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteApplication(id) {
    if (!window.confirm('Delete this application?')) return;

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Could not delete application.');
      }

      setApplications((current) =>
        current.filter((application) => application._id !== id)
      );
    } catch (err) {
      setError(err.message);
    }
  }

  if (!token) {
    return <Auth onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h1>ApplyTrack</h1>

        <button
          className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActivePage('dashboard')}
        >
          ▦ &nbsp; Dashboard
        </button>

        <button
          className={`nav-item ${activePage === 'applications' ? 'active' : ''}`}
          onClick={() => setActivePage('applications')}
        >
          ▤ &nbsp; Applications
        </button>
      </aside>

      <main className="main-content">
        <header className="page-header">
          <div>
            <p className="eyebrow">YOUR JOB SEARCH</p>
            <h2>
              {activePage === 'dashboard' ? 'Dashboard' : 'Applications'}
            </h2>
            <p className="welcome-message">Signed in as {user?.name}</p>
          </div>

          <div className="header-actions">
            <button className="logout-button" onClick={handleLogout}>
              Sign out
            </button>

            <button
              className="add-button"
              onClick={showForm ? closeForm : openAddForm}
            >
              {showForm ? 'Cancel' : '+ Add application'}
            </button>
          </div>
        </header>

        {activePage === 'dashboard' && (
          <section className="stats">
            <article className="stat-card">
              <p>Total applications</p>
              <strong>{applications.length}</strong>
            </article>

            <article className="stat-card">
              <p>Interviews</p>
              <strong>{interviewCount}</strong>
            </article>

            <article className="stat-card">
              <p>Offers</p>
              <strong>{offerCount}</strong>
            </article>
          </section>
        )}

        <section className="application-section">
          <div className="section-heading">
            <div>
              <h3>
                {activePage === 'dashboard'
                  ? 'Recent applications'
                  : 'All applications'}
              </h3>
              <p>
                {activePage === 'dashboard'
                  ? 'Your five most recent job opportunities'
                  : 'Search and manage your job opportunities'}
              </p>
            </div>

            <div className="filter-controls">
              <input
                type="search"
                placeholder="Search company or role..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">All statuses</option>
                <option value="Interested">Interested</option>
                <option value="Applied">Applied</option>
                <option value="Interview">Interview</option>
                <option value="Offer">Offer</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          {showForm && (
            <form className="application-form" onSubmit={handleSaveApplication}>
              <h3>{editingId ? 'Edit application' : 'Add a job application'}</h3>

              <div className="form-grid">
                <label>
                  Company *
                  <input
                    name="company"
                    value={form.company}
                    onChange={handleChange}
                    placeholder="Example: Acme"
                    required
                  />
                </label>

                <label>
                  Role *
                  <input
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    placeholder="Example: Junior Developer"
                    required
                  />
                </label>

                <label>
                  Job link
                  <input
                    name="jobLink"
                    type="url"
                    value={form.jobLink}
                    onChange={handleChange}
                    placeholder="https://..."
                  />
                </label>

                <label>
                  Status
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >
                    <option>Interested</option>
                    <option>Applied</option>
                    <option>Interview</option>
                    <option>Offer</option>
                    <option>Rejected</option>
                  </select>
                </label>

                <label className="notes-field">
                  Notes
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Add details you want to remember"
                    rows="3"
                  />
                </label>
              </div>

              {formError && <p className="form-error">{formError}</p>}

              <button className="save-button" type="submit" disabled={saving}>
                {saving
                  ? 'Saving...'
                  : editingId
                    ? 'Save changes'
                    : 'Save application'}
              </button>
            </form>
          )}

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Role</th>
                  <th>Date applied</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5">Loading applications...</td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="5">{error}</td>
                  </tr>
                ) : visibleApplications.length === 0 ? (
                  <tr>
                    <td colSpan="5">No matching applications found.</td>
                  </tr>
                ) : (
                  visibleApplications.map((application) => (
                    <tr key={application._id}>
                      <td>{application.company}</td>
                      <td>{application.role}</td>
                      <td>
                        {application.dateApplied
                          ? new Date(application.dateApplied).toLocaleDateString()
                          : '-'}
                      </td>
                      <td>
                        <span
                          className={`status status-${application.status.toLowerCase()}`}
                        >
                          {application.status}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <button
                          className="edit-button"
                          onClick={() => openEditForm(application)}
                        >
                          Edit
                        </button>

                        <button
                          className="delete-button"
                          onClick={() =>
                            handleDeleteApplication(application._id)
                          }
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;