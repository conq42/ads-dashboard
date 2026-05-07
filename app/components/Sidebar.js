'use client';

const CONNECTIONS = [
  { label: 'Meta Ads', color: '#1877F2' },
  { label: 'Google Ads', color: '#34A853' },
  { label: 'GA4', color: '#f59e0b' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="logo">
        <span className="logo-mark">◈</span>
        <span className="logo-text">AdsAI</span>
        <span className="logo-badge">BETA</span>
      </div>

      <nav className="nav-section">
        <span className="nav-label">Navigation</span>
        <button className="nav-item active">
          <span className="nav-icon">▦</span>
          Dashboard
        </button>
      </nav>

      <div className="conn-section">
        <span className="nav-label">Data sources</span>
        {CONNECTIONS.map((c) => (
          <div key={c.label} className="conn-row">
            <span className="conn-dot live" style={{ background: c.color, boxShadow: `0 0 7px ${c.color}88` }} />
            {c.label}
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <p>Powered by Claude<br />+ MCP ad server</p>
      </div>
    </aside>
  );
}
