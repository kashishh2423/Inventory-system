import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Package, Users, ShoppingCart, IndianRupee, AlertTriangle, RefreshCw } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.dashboard.get();
      setData(res);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%', flexDirection: 'column', gap: '16px' }}>
        <RefreshCw className="text-primary animate-fade-in" size={36} style={{ animation: 'spin 2s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Aggregating real-time business insights...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card text-center" style={{ margin: '40px auto', maxWidth: '500px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
        <AlertTriangle className="text-danger" size={48} style={{ marginBottom: '16px' }} />
        <h3 style={{ marginBottom: '8px' }}>Dashboard Fetch Failed</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{error}</p>
        <button className="btn btn-primary" onClick={fetchDashboardData}>Try Again</button>
      </div>
    );
  }

  const { stats, orders_trend, inventory_distribution, top_products } = data;

  // 1. Line Chart Calculations (Daily Orders over 30 Days)
  const maxCount = Math.max(...orders_trend.map(d => d.count), 5); // default min 5 for height scaling
  const width = 600;
  const height = 180;
  const paddingLeft = 35;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 25;
  
  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;
  
  const points = orders_trend.map((d, index) => {
    const x = paddingLeft + (index / (orders_trend.length - 1)) * plotWidth;
    // invert y because svg starts at top-left
    const y = paddingTop + plotHeight - (d.count / maxCount) * plotHeight;
    return { x, y, date: d.date, count: d.count, revenue: d.revenue };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + plotHeight} L ${points[0].x} ${paddingTop + plotHeight} Z`
    : '';

  // 2. Donut Chart Calculations (Inventory Distribution)
  const totalInv = inventory_distribution.in_stock + inventory_distribution.low_stock + inventory_distribution.out_of_stock || 1;
  const inStockPct = (inventory_distribution.in_stock / totalInv) * 100;
  const lowStockPct = (inventory_distribution.low_stock / totalInv) * 100;
  const outOfStockPct = (inventory_distribution.out_of_stock / totalInv) * 100;

  // Circular calculations for donut
  const radius = 50;
  const circ = 2 * Math.PI * radius;
  const strokeIn = (inStockPct / 100) * circ;
  const strokeLow = (lowStockPct / 100) * circ;
  const strokeOut = (outOfStockPct / 100) * circ;

  return (
    <div className="animate-fade-in">
      {/* Metrics Row */}
      <div className="grid-cols-4">
        {/* Total Products */}
        <div className="card">
          <div className="widget-header">
            <span>TOTAL PRODUCTS</span>
            <div className="widget-icon-container">
              <Package className="text-primary" size={18} />
            </div>
          </div>
          <div className="widget-value">{stats.total_products}</div>
          <div className="widget-desc">Catalogue Items Managed</div>
        </div>

        {/* Total Customers */}
        <div className="card">
          <div className="widget-header">
            <span>TOTAL CUSTOMERS</span>
            <div className="widget-icon-container">
              <Users className="text-success" size={18} />
            </div>
          </div>
          <div className="widget-value">{stats.total_customers}</div>
          <div className="widget-desc">Registered Business Buyers</div>
        </div>

        {/* Total Orders */}
        <div className="card">
          <div className="widget-header">
            <span>TOTAL ORDERS</span>
            <div className="widget-icon-container">
              <ShoppingCart className="text-warning" size={18} />
            </div>
          </div>
          <div className="widget-value">{stats.total_orders}</div>
          <div className="widget-desc">Fulfillment Requests</div>
        </div>

        {/* Revenue */}
        <div className="card" style={{ borderLeft: '3px solid var(--success)' }}>
          <div className="widget-header">
            <span>REVENUE</span>
            <div className="widget-icon-container" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)' }}>
              <IndianRupee className="text-success" size={18} />
            </div>
          </div>
          <div className="widget-value">₹{stats.revenue.toLocaleString('en-IN')}</div>
          <div className="widget-desc">Processed Subtotal (Net)</div>
        </div>

        {/* Low Stock Widget */}
        <div className="card" style={{ borderLeft: stats.low_stock_restock > 0 ? '3px solid var(--danger)' : '1px solid var(--glass-border)' }}>
          <div className="widget-header">
            <span>LOW STOCK ALERTS</span>
            <div className="widget-icon-container" style={{ backgroundColor: stats.low_stock_restock > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.05)' }}>
              <AlertTriangle className={stats.low_stock_restock > 0 ? 'text-danger' : 'text-muted'} size={18} />
            </div>
          </div>
          <div className="widget-value text-danger">{stats.low_stock_restock}</div>
          <div className="widget-desc">Products Needing Restocking</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        
        {/* Orders Trend Line Chart */}
        <div className="card chart-card">
          <h3 className="chart-title">Orders Trend (Last 30 Days)</h3>
          <div className="chart-content">
            <svg viewBox={`0 0 ${width} ${height}`} className="svg-chart">
              <defs>
                <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              {/* Y Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                const y = paddingTop + plotHeight * ratio;
                const value = Math.round(maxCount * (1 - ratio));
                return (
                  <g key={index}>
                    <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} className="svg-grid-line" />
                    <text x={paddingLeft - 8} y={y + 4} textAnchor="end" className="svg-axis-text">{value}</text>
                  </g>
                );
              })}

              {/* Area Path */}
              {areaPath && <path d={areaPath} className="svg-area" />}

              {/* Line Path */}
              {linePath && <path d={linePath} className="svg-line" />}

              {/* Data points markers */}
              {points.filter((_, i) => i % 5 === 0 || i === points.length - 1).map((p, index) => (
                <g key={index}>
                  <circle cx={p.x} cy={p.y} r={4} fill="var(--bg-dark)" stroke="var(--primary)" strokeWidth={2} />
                  <text x={p.x} y={paddingTop + plotHeight + 16} textAnchor="middle" className="svg-axis-text" style={{ fontSize: '9px' }}>
                    {p.date.split('-')[2]}/{p.date.split('-')[1]}
                  </text>
                </g>
              ))}

              {/* Bottom Axis Line */}
              <line x1={paddingLeft} y1={paddingTop + plotHeight} x2={width - paddingRight} y2={paddingTop + plotHeight} className="svg-axis-line" />
            </svg>
          </div>
        </div>

        {/* Inventory Distribution Donut Chart */}
        <div className="card chart-card">
          <h3 className="chart-title">Inventory Status Distribution</h3>
          <div className="chart-content" style={{ display: 'flex', gap: '24px', alignItems: 'center', justifyContent: 'center' }}>
            
            <div style={{ position: 'relative', width: '160px', height: '160px' }}>
              <svg viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                {/* Background Circle */}
                <circle cx="60" cy="60" r={radius} fill="transparent" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="10" />
                
                {/* In Stock Slice */}
                {strokeIn > 0 && (
                  <circle cx="60" cy="60" r={radius} fill="transparent" stroke="var(--success)" strokeWidth="10"
                    strokeDasharray={`${strokeIn} ${circ}`}
                    className="pie-slice"
                  />
                )}

                {/* Low Stock Slice */}
                {strokeLow > 0 && (
                  <circle cx="60" cy="60" r={radius} fill="transparent" stroke="var(--warning)" strokeWidth="10"
                    strokeDasharray={`${strokeLow} ${circ}`}
                    strokeDashoffset={-strokeIn}
                    className="pie-slice"
                  />
                )}

                {/* Out Of Stock Slice */}
                {strokeOut > 0 && (
                  <circle cx="60" cy="60" r={radius} fill="transparent" stroke="var(--danger)" strokeWidth="10"
                    strokeDasharray={`${strokeOut} ${circ}`}
                    strokeDashoffset={-(strokeIn + strokeLow)}
                    className="pie-slice"
                  />
                )}
              </svg>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
              }}>
                <span style={{ fontSize: '20px', fontWeight: '700' }}>{totalInv}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Items</span>
              </div>
            </div>

            {/* Legends */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--success)' }}></span>
                <span>In Stock ({inventory_distribution.in_stock})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--warning)' }}></span>
                <span>Low Stock ({inventory_distribution.low_stock})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--danger)' }}></span>
                <span>Out of Stock ({inventory_distribution.out_of_stock})</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Top Selling Products */}
      <div className="card">
        <h3 className="chart-title">Best Selling Products (Top 5)</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {top_products.map((p, index) => {
            // Find max sales for relative scaling of horizontal bars
            const maxSales = Math.max(...top_products.map(x => x.units_sold), 1);
            const scaleWidth = (p.units_sold / maxSales) * 100;
            return (
              <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ fontWeight: '500' }}>{p.name} <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>({p.sku})</span></span>
                  <span style={{ fontWeight: '600' }}>{p.units_sold} Units <span style={{ color: 'var(--text-muted)', fontWeight: '400', marginLeft: '6px' }}>| ₹{p.total_sales.toLocaleString('en-IN')}</span></span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${scaleWidth}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, var(--primary) 0%, #3B82F6 100%)',
                    borderRadius: '4px',
                    transition: 'width 1s ease-out'
                  }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
