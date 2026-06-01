import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Package, Search, Plus, Edit2, Trash2, ChevronLeft, ChevronRight, X, AlertCircle } from 'lucide-react';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    category: '',
    price: '',
    stock_quantity: '',
    image_url: ''
  });

  const categoriesList = ['Electronics', 'Office Supplies', 'Furniture', 'Apparel', 'Kitchenware'];

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.products.list({
        search,
        category,
        sort_by: sortBy,
        sort_order: sortOrder,
        page,
        limit
      });
      setProducts(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch products catalogue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, category, sortBy, sortOrder, page]);

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      description: '',
      category: categoriesList[0],
      price: '',
      stock_quantity: '',
      image_url: ''
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      description: product.description || '',
      category: product.category || categoriesList[0],
      price: product.price,
      stock_quantity: product.stock_quantity,
      image_url: product.image_url || ''
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.products.delete(id);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to delete product.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError(null);

    // Basic Validations
    if (!formData.name.trim() || !formData.sku.trim()) {
      setModalError('Product Name and SKU are required.');
      return;
    }
    if (isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      setModalError('Price must be a positive number.');
      return;
    }
    if (isNaN(formData.stock_quantity) || parseInt(formData.stock_quantity) < 0) {
      setModalError('Stock cannot be negative.');
      return;
    }

    try {
      const payload = {
        name: formData.name,
        sku: formData.sku,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity),
        image_url: formData.image_url || null
      };

      if (editingProduct) {
        await api.products.update(editingProduct.id, payload);
      } else {
        await api.products.create(payload);
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error(err);
      // Support showing precise duplicate SKU warning from backend: { "error": "SKU already exists" }
      const errorMsg = err.details?.error || err.message || 'Operation failed.';
      setModalError(errorMsg);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="animate-fade-in">
      {/* Search & Actions Header */}
      <div className="filter-bar">
        <div style={{ display: 'flex', gap: '12px', flex: 1, flexWrap: 'wrap' }}>
          <div className="search-input-container">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search by name or SKU..."
              className="form-control search-input"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          
          <select
            className="form-control"
            style={{ width: '160px' }}
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          >
            <option value="">All Categories</option>
            {categoriesList.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            className="form-control"
            style={{ width: '160px' }}
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
              setPage(1);
            }}
          >
            <option value="created_at-desc">Newest First</option>
            <option value="created_at-asc">Oldest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="stock_quantity-asc">Stock: Low to High</option>
            <option value="stock_quantity-desc">Stock: High to Low</option>
          </select>
        </div>

        <button className="btn btn-primary" onClick={handleOpenCreateModal}>
          <Plus size={16} /> Add Product
        </button>
      </div>

      {error && (
        <div className="card text-center" style={{ margin: '20px 0', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <p className="text-danger">{error}</p>
        </div>
      )}

      {/* Products Table */}
      <div className="table-container">
        {loading && products.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Retrieving inventory catalogue...
          </div>
        ) : products.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No products found matching filters.
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const isLow = p.stock_quantity <= 10 && p.stock_quantity > 0;
                const isOut = p.stock_quantity === 0;
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img 
                          src={p.image_url || 'https://picsum.photos/seed/placeholder/80/80'} 
                          alt={p.name} 
                          style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.05)' }} 
                        />
                        <div>
                          <div style={{ fontWeight: '600' }}>{p.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.description || 'No description provided.'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontWeight: '500' }}>{p.sku}</td>
                    <td>{p.category || 'Uncategorized'}</td>
                    <td style={{ fontWeight: '600' }}>₹{parseFloat(p.price).toFixed(2)}</td>
                    <td>
                      {isOut ? (
                        <span className="badge badge-danger">OUT OF STOCK (0)</span>
                      ) : isLow ? (
                        <span className="badge badge-warning">LOW STOCK ({p.stock_quantity})</span>
                      ) : (
                        <span className="badge badge-success">IN STOCK ({p.stock_quantity})</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-secondary" onClick={() => handleOpenEditModal(p)} style={{ padding: '6px 10px' }}>
                          <Edit2 size={13} />
                        </button>
                        <button className="btn btn-danger" onClick={() => handleDelete(p.id)} style={{ padding: '6px 10px' }}>
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

      {/* Pagination Footer */}
      {!loading && products.length > 0 && (
        <div className="pagination">
          <span className="pagination-text">
            Showing Page {page} of {totalPages} ({total} Total Products)
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

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
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
                <label className="form-label">Product Name *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">SKU (Stock Keeping Unit) *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  disabled={!!editingProduct} // SKU shouldn't be edited once created for simplicity, or we check database uniqueness
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Stock Quantity *</label>
                  <input
                    type="number"
                    className="form-control"
                    required
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-control"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {categoriesList.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="https://picsum.photos/..."
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
