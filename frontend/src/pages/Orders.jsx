import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ShoppingCart, Plus, Trash2, Eye, X, AlertCircle, ShoppingBag, PlusCircle, Trash, RefreshCw } from 'lucide-react';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Selector cache
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  // Create Order Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerError, setDrawerError] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  
  // Cart: list of { product, quantity }
  const [cart, setCart] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  // Details Modal state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.orders.list({ page, limit });
      setOrders(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch orders log.');
    } finally {
      setLoading(false);
    }
  };

  const loadSelectors = async () => {
    try {
      // Load first page of customers and products for selector dropdowns
      const custRes = await api.customers.list({ page: 1, limit: 100 });
      const prodRes = await api.products.list({ page: 1, limit: 100 });
      setCustomers(custRes.items);
      setProducts(prodRes.items);
    } catch (err) {
      console.error('Failed to load customers/products for selection', err);
    }
  };

  useEffect(() => {
    fetchOrders();
    loadSelectors();
  }, [page]);

  const handleOpenDrawer = () => {
    setSelectedCustomerId(customers[0]?.id || '');
    setCart([]);
    setSelectedProductId(products[0]?.id || '');
    setSelectedQuantity(1);
    setDrawerError(null);
    setIsDrawerOpen(true);
  };

  const handleAddToCart = () => {
    if (!selectedProductId) return;
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    if (selectedQuantity <= 0) {
      alert('Quantity must be greater than 0.');
      return;
    }

    // Client-side stock check warning
    if (product.stock_quantity < selectedQuantity) {
      if (!window.confirm(`Warning: Stock quantity is only ${product.stock_quantity}. Attempting to order ${selectedQuantity} might be rejected by the server. Add anyway?`)) {
        return;
      }
    }

    // Check if product already exists in cart
    const existingIndex = cart.findIndex(item => item.product.id === product.id);
    if (existingIndex > -1) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += parseInt(selectedQuantity);
      setCart(newCart);
    } else {
      setCart([...cart, { product, quantity: parseInt(selectedQuantity) }]);
    }
  };

  const handleRemoveFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.orders.updateStatus(id, status);
      fetchOrders();
      if (selectedOrder && selectedOrder.id === id) {
        // reload details
        handleOpenDetails(id);
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Status update failed.');
    }
  };

  const handleOpenDetails = async (id) => {
    try {
      setDetailsLoading(true);
      setSelectedOrder(null);
      const details = await api.orders.get(id);
      setSelectedOrder(details);
    } catch (err) {
      console.error(err);
      alert('Failed to retrieve order invoice details.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!window.confirm('Deleting an order will remove it permanently. Restock counts will be reversed. Continue?')) return;
    try {
      await api.orders.delete(id);
      fetchOrders();
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder(null);
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to delete order.');
    }
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setDrawerError(null);

    if (!selectedCustomerId) {
      setDrawerError('Please select a customer.');
      return;
    }
    if (cart.length === 0) {
      setDrawerError('Your cart is empty. Add at least one product.');
      return;
    }

    try {
      const payload = {
        customer_id: selectedCustomerId,
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity
        }))
      };

      await api.orders.create(payload);
      setIsDrawerOpen(false);
      fetchOrders();
      // Reload products catalog in background in case stock counts changed
      loadSelectors();
    } catch (err) {
      console.error(err);
      // Format standard error response shape: { success: false, message: "Inventory insufficient", error_code: "INSUFFICIENT_STOCK" }
      const errorMsg = err.details?.message || err.message || 'Failed to create order.';
      const errorCode = err.details?.error_code || err.errorCode || '';
      setDrawerError(`${errorMsg} ${errorCode ? `(Code: ${errorCode})` : ''}`);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;
  const cartTotal = cart.reduce((sum, item) => sum + (parseFloat(item.product.price) * item.quantity), 0);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
      
      {/* Orders List */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="filter-bar">
          <h2 style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-secondary)' }}>Fulfillment Log</h2>
          <button className="btn btn-primary" onClick={handleOpenDrawer}>
            <Plus size={16} /> Create Order
          </button>
        </div>

        {error && (
          <div className="card text-center" style={{ margin: '20px 0', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <p className="text-danger">{error}</p>
          </div>
        )}

        <div className="table-container">
          {loading && orders.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Loading orders log...
            </div>
          ) : orders.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No orders placed yet. Click "Create Order" to start.
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Date Placed</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const isCompleted = o.status === 'Completed';
                  const isCancelled = o.status === 'Cancelled';
                  const isProcessing = o.status === 'Processing';
                  const badgeClass = isCompleted ? 'badge-success' : isCancelled ? 'badge-danger' : isProcessing ? 'badge-warning' : 'badge-secondary';
                  return (
                    <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => handleOpenDetails(o.id)}>
                      <td style={{ fontFamily: 'monospace', fontWeight: '600', fontSize: '12px' }}>
                        {o.id.substring(0, 8)}...
                      </td>
                      <td>{o.customer?.full_name || 'Deleted Customer'}</td>
                      <td style={{ fontWeight: '600' }}>₹{parseFloat(o.total_amount).toLocaleString('en-IN')}</td>
                      <td>
                        <span className={`badge ${badgeClass}`}>{o.status}</span>
                      </td>
                      <td>{new Date(o.created_at).toLocaleString()}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <select
                            className="form-control"
                            style={{ padding: '4px 8px', fontSize: '12px', width: '120px' }}
                            value={o.status}
                            onChange={(e) => handleUpdateStatus(o.id, e.target.value)}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                          <button className="btn btn-secondary" onClick={() => handleOpenDetails(o.id)} style={{ padding: '6px 10px' }}>
                            <Eye size={13} />
                          </button>
                          <button className="btn btn-danger" onClick={() => handleDeleteOrder(o.id)} style={{ padding: '6px 10px' }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && orders.length > 0 && (
          <div className="pagination">
            <span className="pagination-text">
              Showing Page {page} of {totalPages} ({total} Orders)
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

      {/* Invoice Details Side Panel */}
      {(selectedOrder || detailsLoading) && (
        <div className="card animate-fade-in" style={{ width: '380px', flexShrink: 0, position: 'sticky', top: '10px' }}>
          <div style={{ display: 'flex', justifyContext: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Order Details</h3>
            <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginLeft: 'auto' }} onClick={() => setSelectedOrder(null)}>
              <X size={18} />
            </button>
          </div>

          {detailsLoading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Loading invoice details...
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Order ID</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: '500', fontSize: '13px' }}>{selectedOrder.id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Customer</span>
                  <span style={{ fontWeight: '600', fontSize: '13px' }}>{selectedOrder.customer?.full_name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Date Placed</span>
                  <span style={{ fontSize: '13px' }}>{new Date(selectedOrder.created_at).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Status</span>
                  <span style={{ fontSize: '13px' }}>
                    <span className={`badge ${selectedOrder.status === 'Completed' ? 'badge-success' : selectedOrder.status === 'Cancelled' ? 'badge-danger' : selectedOrder.status === 'Processing' ? 'badge-warning' : 'badge-secondary'}`}>
                      {selectedOrder.status}
                    </span>
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '12px' }}>Items Summary</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <div>
                        <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{item.product?.name || 'Deleted Product'}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{item.quantity} x ₹{parseFloat(item.unit_price).toFixed(2)}</div>
                      </div>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)', alignSelf: 'center' }}>₹{parseFloat(item.subtotal).toFixed(2)}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', marginTop: '16px', paddingTop: '16px', fontWeight: '700', fontSize: '15px' }}>
                  <span>Total Amount</span>
                  <span className="text-success">₹{parseFloat(selectedOrder.total_amount).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Order Drawer/Overlay */}
      {isDrawerOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Create Sales Order</h3>
              <button className="modal-close" onClick={() => setIsDrawerOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitOrder}>
              {drawerError && (
                <div style={{ display: 'flex', gap: '8px', padding: '12px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '18px', alignItems: 'center' }}>
                  <AlertCircle className="text-danger" size={16} />
                  <span style={{ fontSize: '13px', color: 'var(--danger)', fontWeight: '500' }}>{drawerError}</span>
                </div>
              )}

              {/* Customer Selector */}
              <div className="form-group">
                <label className="form-label">Select Customer *</label>
                <select
                  className="form-control"
                  required
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                >
                  <option value="" disabled>-- Select Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>
                  ))}
                </select>
              </div>

              {/* Product Cart Builder */}
              <div className="card" style={{ padding: '16px', backgroundColor: 'rgba(0,0,0,0.1)', marginBottom: '20px', border: '1px dashed var(--border-color)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '12px' }}>Add Products to Order</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '12px', alignItems: 'end' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '11px' }}>Product</label>
                    <select
                      className="form-control"
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku}) - Price: ₹{p.price} | Stock: {p.stock_quantity}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '11px' }}>Quantity</label>
                    <input
                      type="number"
                      min="1"
                      className="form-control"
                      value={selectedQuantity}
                      onChange={(e) => setSelectedQuantity(e.target.value)}
                    />
                  </div>
                  <button type="button" className="btn btn-secondary" onClick={handleAddToCart} style={{ height: '40px' }}>
                    <PlusCircle size={16} /> Add
                  </button>
                </div>
              </div>

              {/* Cart List */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '10px' }}>Order Items ({cart.length})</h4>
                
                {cart.length === 0 ? (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                    Cart is empty. Add products above.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                    {cart.map((item, index) => (
                      <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', fontSize: '13px' }}>
                        <div>
                          <div style={{ fontWeight: '500' }}>{item.product.name}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{item.quantity} x ₹{parseFloat(item.product.price).toFixed(2)}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          <span style={{ fontWeight: '600' }}>₹{(parseFloat(item.product.price) * item.quantity).toFixed(2)}</span>
                          <button type="button" className="btn btn-danger" onClick={() => handleRemoveFromCart(index)} style={{ padding: '4px', borderRadius: '4px' }}>
                            <Trash size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Drawer Total */}
              {cart.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginBottom: '24px', fontWeight: '700', fontSize: '16px' }}>
                  <span>Estimated Total</span>
                  <span className="text-success">₹{cartTotal.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsDrawerOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
