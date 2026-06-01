import React, { useState } from 'react';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Orders from './pages/Orders';
import { Package, Users, ShoppingCart, BarChart3, LogOut, ShieldAlert } from 'lucide-react';

function App() {
  const [view, setView] = useState('landing');
  // Dynamic User Role Simulation
  const [userRole, setUserRole] = useState('Business Owner'); // Default

  // Determine what navigation links are allowed per role
  const isAllowed = (page) => {
    if (userRole === 'Business Owner') return true;
    if (userRole === 'Inventory Manager') {
      return page === 'dashboard' || page === 'products';
    }
    if (userRole === 'Sales Executive') {
      return page === 'products' || page === 'customers' || page === 'orders';
    }
    return false;
  };

  // Safe navigation that respects role limits (auto redirects if needed)
  const navigateTo = (destination) => {
    if (isAllowed(destination)) {
      setView(destination);
    } else {
      // Redirect to first allowed view
      if (userRole === 'Inventory Manager') setView('dashboard');
      else if (userRole === 'Sales Executive') setView('products');
    }
  };

  const handleRoleChange = (role) => {
    setUserRole(role);
    // If current view is not allowed in new role, redirect
    if (role === 'Inventory Manager' && view !== 'dashboard' && view !== 'products') {
      setView('dashboard');
    } else if (role === 'Sales Executive' && view === 'dashboard') {
      setView('products');
    }
  };

  if (view === 'landing') {
    return <Landing setView={(v) => { setView(v); navigateTo(v); }} />;
  }

  // Get Initials for Avatar
  const getInitials = () => {
    if (userRole === 'Business Owner') return 'BO';
    if (userRole === 'Inventory Manager') return 'IM';
    return 'SE';
  };

  return (
    <div className="app-container">
      {/* Sidebar navigation */}
      <aside className="sidebar">
        <div>
          <div className="logo-container" onClick={() => setView('landing')} style={{ cursor: 'pointer' }}>
            <Package className="text-success" size={24} />
            <span className="logo-text">InventoryFlow</span>
          </div>

          <nav>
            <ul className="nav-list">
              {isAllowed('dashboard') && (
                <li>
                  <a href="#dashboard" className={`nav-link ${view === 'dashboard' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setView('dashboard'); }}>
                    <BarChart3 size={18} />
                    <span className="nav-text">Dashboard</span>
                  </a>
                </li>
              )}
              {isAllowed('products') && (
                <li>
                  <a href="#products" className={`nav-link ${view === 'products' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setView('products'); }}>
                    <Package size={18} />
                    <span className="nav-text">Products</span>
                  </a>
                </li>
              )}
              {isAllowed('customers') && (
                <li>
                  <a href="#customers" className={`nav-link ${view === 'customers' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setView('customers'); }}>
                    <Users size={18} />
                    <span className="nav-text">Customers</span>
                  </a>
                </li>
              )}
              {isAllowed('orders') && (
                <li>
                  <a href="#orders" className={`nav-link ${view === 'orders' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setView('orders'); }}>
                    <ShoppingCart size={18} />
                    <span className="nav-text">Orders</span>
                  </a>
                </li>
              )}
            </ul>
          </nav>
        </div>

        <div>
          <a href="#logout" className="nav-link" onClick={(e) => { e.preventDefault(); setView('landing'); }} style={{ color: 'var(--text-muted)' }}>
            <LogOut size={18} />
            <span className="nav-text">Log Out</span>
          </a>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="main-content">
        <header className="header">
          <h2 className="page-title" style={{ textTransform: 'capitalize' }}>
            {view}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Live Role Switcher (Simulation Feature) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>Role:</span>
              <select
                className="form-control"
                style={{ padding: '6px 12px', fontSize: '13px', width: '160px', backgroundColor: 'rgba(255,255,255,0.05)' }}
                value={userRole}
                onChange={(e) => handleRoleChange(e.target.value)}
              >
                <option value="Business Owner">Business Owner</option>
                <option value="Inventory Manager">Inventory Manager</option>
                <option value="Sales Executive">Sales Executive</option>
              </select>
            </div>

            {/* Profile Avatar */}
            <div className="user-profile">
              <div className="user-avatar" title={`Logged in as ${userRole}`}>
                {getInitials()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }} className="nav-text">
                <span style={{ fontSize: '13px', fontWeight: '600' }}>{userRole}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Demo Account</span>
              </div>
            </div>
          </div>
        </header>

        <div className="content-body">
          {view === 'dashboard' && isAllowed('dashboard') && <Dashboard />}
          {view === 'products' && isAllowed('products') && <Products />}
          {view === 'customers' && isAllowed('customers') && <Customers />}
          {view === 'orders' && isAllowed('orders') && <Orders />}

          {/* Access Denied Fallback */}
          {!isAllowed(view) && (
            <div className="card text-center animate-fade-in" style={{ margin: '80px auto', maxWidth: '450px' }}>
              <ShieldAlert className="text-danger" size={48} style={{ marginBottom: '16px' }} />
              <h3>Access Denied</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '8px', marginBottom: '24px' }}>
                Your current role (<strong>{userRole}</strong>) does not have authorization to view this panel.
              </p>
              <button className="btn btn-primary" onClick={() => handleRoleChange('Business Owner')}>
                Switch to Business Owner
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
