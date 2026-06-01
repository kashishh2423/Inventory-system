import React, { useEffect, useState } from 'react';
import { Package, Users, ShoppingCart, BarChart3, Shield, Zap, CheckCircle, Cpu, ArrowRight } from 'lucide-react';

export default function Landing({ setView }) {
  // Animated Counters
  const [productsCount, setProductsCount] = useState(0);
  const [customersCount, setCustomersCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);

  useEffect(() => {
    // Basic counter animation
    const animateCounter = (target, setter, duration) => {
      let start = 0;
      const stepTime = Math.abs(Math.floor(duration / target));
      const timer = setInterval(() => {
        start += 1;
        setter(start);
        if (start >= target) {
          clearInterval(timer);
        }
      }, stepTime || 1);
    };

    animateCounter(150, setProductsCount, 1200);
    animateCounter(85, setCustomersCount, 1200);
    animateCounter(240, setOrdersCount, 1200);
  }, []);

  return (
    <div className="landing-container animate-fade-in">
      {/* Navbar */}
      <nav className="landing-navbar">
        <div className="logo-container" style={{ marginBottom: 0 }}>
          <Package className="text-success" size={24} />
          <span className="logo-text" style={{ fontSize: '22px' }}>InventoryFlow</span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className="btn btn-secondary" onClick={() => setView('dashboard')}>
            Log In
          </button>
          <button className="btn btn-primary" onClick={() => setView('dashboard')}>
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="landing-hero">
        <div className="landing-hero-content">
          <div className="landing-tagline">Cloud Inventory & Orders</div>
          <h1 className="landing-headline">
            Smart Inventory Management For Modern Businesses
          </h1>
          <p className="landing-subheadline">
            Manage products, customers, orders, and inventory from one powerful, modern dashboard. Stop manual spreadsheets and start tracking in real-time.
          </p>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button className="btn btn-primary btn-lg" onClick={() => setView('dashboard')} style={{ padding: '14px 28px', fontSize: '15px' }}>
              Get Started <ArrowRight size={18} />
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => setView('dashboard')} style={{ padding: '14px 28px', fontSize: '15px' }}>
              View Dashboard
            </button>
          </div>
        </div>
        <div className="landing-hero-illustration">
          <img src="/warehouse_mockup.png" alt="Inventory dashboard mockup" className="mockup-img" />
        </div>
      </header>

      {/* Statistics Counters */}
      <section className="landing-stats">
        <div className="stats-grid">
          <div>
            <div className="stat-number">{productsCount}+</div>
            <div className="stat-label">Products Managed</div>
          </div>
          <div>
            <div className="stat-number">{ordersCount}+</div>
            <div className="stat-label">Orders Processed</div>
          </div>
          <div>
            <div className="stat-number">{customersCount}+</div>
            <div className="stat-label">Active Customers</div>
          </div>
          <div>
            <div className="stat-number">99.9%</div>
            <div className="stat-label">Stock Accuracy</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="landing-features">
        <div className="section-title-container">
          <div className="section-label">Features</div>
          <h2 className="section-title">Centralized Platform Modules</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Everything you need to track stock levels, customers, and order fulfillment in real-time.</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-container">
              <Package size={24} />
            </div>
            <h3 className="feature-title">Product Management</h3>
            <p className="feature-desc">Create, update, search, sort, and manage products. Track SKU mappings, pricing, and specific product details.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-container">
              <Users size={24} />
            </div>
            <h3 className="feature-title">Customer Management</h3>
            <p className="feature-desc">Maintain comprehensive records of client contacts, order histories, and purchase analytics.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-container">
              <ShoppingCart size={24} />
            </div>
            <h3 className="feature-title">Order Processing</h3>
            <p className="feature-desc">Streamlined ordering system with auto pricing calculations, inventory validations, and status tracking.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-container">
              <BarChart3 size={24} />
            </div>
            <h3 className="feature-title">Inventory Monitoring</h3>
            <p className="feature-desc">Real-time alerts for low stock levels, automatic updates on checkout, and visual distribution metrics.</p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="landing-benefits">
        <div className="section-title-container">
          <div className="section-label">Benefits</div>
          <h2 className="section-title">Why Choose InventoryFlow?</h2>
        </div>

        <div className="benefits-grid">
          <div className="benefit-card">
            <h4 className="benefit-title">
              <Zap className="text-success" size={20} /> Faster Operations
            </h4>
            <p className="benefit-desc">Automate stock updates and order calculation. Reduce manual processes and human keying errors.</p>
          </div>
          <div className="benefit-card">
            <h4 className="benefit-title">
              <CheckCircle className="text-success" size={20} /> Better Accuracy
            </h4>
            <p className="benefit-desc">Prevent negative inventory and overselling. Maintain a 100% sync rate across your database.</p>
          </div>
          <div className="benefit-card">
            <h4 className="benefit-title">
              <BarChart3 className="text-success" size={20} /> Business Insights
            </h4>
            <p className="benefit-desc">Track sales trends, active user counts, revenue metrics, and highest selling products instantly.</p>
          </div>
          <div className="benefit-card">
            <h4 className="benefit-title">
              <Cpu className="text-success" size={20} /> Cloud Ready
            </h4>
            <p className="benefit-desc">Dockerized backend, frontend, and postgres. Deployable to Render, Vercel, or AWS with one command.</p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="landing-cta">
        <div className="cta-box">
          <h2 className="cta-title">Ready to manage inventory smarter?</h2>
          <p className="cta-desc">
            Join hundreds of businesses scaling their retail and wholesale operations with modern centralized inventory control.
          </p>
          <button className="btn btn-primary" onClick={() => setView('dashboard')} style={{ padding: '14px 32px', fontSize: '15px' }}>
            Start Managing Inventory
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-top">
          <div className="footer-info">
            <div className="logo-container" style={{ paddingLeft: 0, marginBottom: '16px' }}>
              <Package className="text-success" size={20} />
              <span className="logo-text" style={{ fontSize: '18px' }}>InventoryFlow</span>
            </div>
            <p className="footer-desc">
              Centralized platform for real-time stock levels, billing, and customer pipelines. Engineered for B2B scale.
            </p>
          </div>
          <div className="footer-links-group">
            <div className="footer-links-col">
              <div className="footer-col-title">Platform</div>
              <a href="#dashboard" onClick={(e) => { e.preventDefault(); setView('dashboard'); }} className="footer-link">Dashboard</a>
              <a href="#products" onClick={(e) => { e.preventDefault(); setView('products'); }} className="footer-link">Products</a>
              <a href="#customers" onClick={(e) => { e.preventDefault(); setView('customers'); }} className="footer-link">Customers</a>
              <a href="#orders" onClick={(e) => { e.preventDefault(); setView('orders'); }} className="footer-link">Orders</a>
            </div>
            <div className="footer-links-col">
              <div className="footer-col-title">Developers</div>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="footer-link">GitHub Repository</a>
              <a href="/api/docs" target="_blank" className="footer-link">API Documentation</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div>© {new Date().getFullYear()} InventoryFlow Inc. All rights reserved.</div>
          <div>Smart Inventory For Modern Enterprise.</div>
        </div>
      </footer>
    </div>
  );
}
