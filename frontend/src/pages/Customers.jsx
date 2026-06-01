import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Users, Search, Plus, Trash2, Eye, X, AlertCircle, ShoppingBag, MapPin, Phone, Mail, Calendar } from 'lucide-react';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [profileCustomer, setProfileCustomer] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    address: ''
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.customers.list({ search, page, limit });
      setCustomers(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch customer index.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, page]);

  const handleOpenCreate = () => {
    setFormData({ full_name: '', email: '', phone_number: '', address: '' });
    setModalError(null);
    setIsCreateOpen(true);
  };

  const handleOpenProfile = async (id) => {
    try {
      setProfileLoading(true);
      setProfileCustomer(null);
      const profile = await api.customers.get(id);
      setProfileCustomer(profile);
    } catch (err) {
      console.error(err);
      alert('Failed to retrieve customer order profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deleting this customer will remove their records. Continue?')) return;
    try {
      await api.customers.delete(id);
      fetchCustomers();
      if (profileCustomer && profileCustomer.id === id) {
        setProfileCustomer(null);
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to delete customer.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError(null);

    // Client-side checks
    if (!formData.full_name.trim() || !formData.email.trim()) {
      setModalError('Full Name and Email are required.');
      return;
    }

    try {
      await api.customers.create(formData);
      setIsCreateOpen(false);
      fetchCustomers();
    } catch (err) {
      console.error(err);
      const errorMsg = err.details?.error || err.message || 'Customer email must be unique.';
      setModalError(errorMsg);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
      
      {/* Customers List Section */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="filter-bar">
          <div className="search-input-container">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              className="form-control search-input"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} /> Add Customer
          </button>
        </div>

        {error && (
          <div className="card text-center" style={{ margin: '20px 0', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <p className="text-danger">{error}</p>
          </div>
        )}

        <div className="table-container">
          {loading && customers.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Loading customers index...
            </div>
          ) : customers.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No customers found.
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Joined Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => handleOpenProfile(c.id)}>
                    <td style={{ fontWeight: '600' }}>{c.full_name}</td>
                    <td>{c.email}</td>
                    <td style={{ fontFamily: 'monospace' }}>{c.phone_number || '-'}</td>
                    <td>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-secondary" onClick={() => handleOpenProfile(c.id)} style={{ padding: '6px 10px' }}>
                          <Eye size={13} />
                        </button>
                        <button className="btn btn-danger" onClick={() => handleDelete(c.id)} style={{ padding: '6px 10px' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Controls */}
        {!loading && customers.length > 0 && (
          <div className="pagination">
            <span className="pagination-text">
              Showing Page {page} of {totalPages} ({total} Customers)
            </span>
            <div className="pagination-buttons">
              <button
                className="btn btn-secondary"
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                style={{ opacity: page === 1 ? 0.5 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                style={{ opacity: page === totalPages ? 0.5 : 1, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Profile Side panel / Drawer (if selected) */}
      {(profileCustomer || profileLoading) && (
        <div className="card" style={{ width: '360px', flexShrink: 0, animation: 'fadeIn 0.3s ease-out', position: 'sticky', top: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Customer Profile</h3>
            <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => setProfileCustomer(null)}>
              <X size={18} />
            </button>
          </div>

          {profileLoading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Loading profile transactions...
            </div>
          ) : (
            <div>
              {/* Contact Card */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>{profileCustomer.full_name}</h4>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <Mail size={14} className="text-primary" />
                  <span>{profileCustomer.email}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <Phone size={14} className="text-primary" />
                  <span>{profileCustomer.phone_number || 'N/A'}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <MapPin size={14} className="text-primary" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span>{profileCustomer.address || 'No address provided.'}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '4px' }}>
                  <Calendar size={13} />
                  <span>Joined on {new Date(profileCustomer.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Purchase History */}
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShoppingBag size={15} /> Purchase History ({profileCustomer.orders.length})
                </h4>

                {profileCustomer.orders.length === 0 ? (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No orders placed yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                    {profileCustomer.orders.map((order) => {
                      const isCompleted = order.status === 'Completed';
                      const isCancelled = order.status === 'Cancelled';
                      const isProcessing = order.status === 'Processing';
                      const badgeClass = isCompleted ? 'badge-success' : isCancelled ? 'badge-danger' : isProcessing ? 'badge-warning' : 'badge-secondary';
                      return (
                        <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', fontSize: '12px' }}>
                          <div>
                            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>₹{parseFloat(order.total_amount).toLocaleString('en-IN')}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{new Date(order.created_at).toLocaleDateString()}</div>
                          </div>
                          <span className={`badge ${badgeClass}`} style={{ alignSelf: 'center', fontSize: '9px', padding: '2px 6px' }}>{order.status}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Customer Modal */}
      {isCreateOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Add New Customer</h3>
              <button className="modal-close" onClick={() => setIsCreateOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              {modalError && (
                <div style={{ display: 'flex', gap: '8px', padding: '12px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '18px', alignItems: 'center' }}>
                  <AlertCircle className="text-danger" size={16} />
                  <span style={{ fontSize: '13px', color: 'var(--danger)', fontWeight: '500' }}>{modalError}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  className="form-control"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 XXXXX XXXXX"
                  className="form-control"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Billing/Shipping Address</label>
                <textarea
                  className="form-control"
                  placeholder="Street, City, Pin Code, State..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                ></textarea>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
