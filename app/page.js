'use client';
import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import KPICards from './components/KPICards';
import SpendChart from './components/SpendChart';
import CampaignTable from './components/CampaignTable';
import ChatPanel from './components/ChatPanel';

const RANGES = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
];

export default function DashboardPage() {
  const [range, setRange] = useState('30d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [chatOpen, setChatOpen] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard?range=${range}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 10 * 60 * 1000); // auto-refresh every 10 min
    return () => clearInterval(timer);
  }, [fetchData]);

  return (
    <div className="app">
      <Sidebar />

      <main className="main">
        {/* Header */}
        <header className="dash-header">
          <div>
            <h1>Dashboard</h1>
            {lastUpdated && (
              <p className="last-updated">
                Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
          <div className="header-right">
            <div className="range-tabs">
              {RANGES.map((r) => (
                <button
                  key={r.value}
                  className={`range-tab ${range === r.value ? 'active' : ''}`}
                  onClick={() => setRange(r.value)}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <button
              className="icon-btn"
              onClick={fetchData}
              disabled={loading}
              title="Refresh data"
            >
              <span className={loading ? 'spin' : ''}>↻</span>
              {loading ? 'Fetching…' : 'Refresh'}
            </button>
            <button
              className={`icon-btn chat-toggle-btn ${chatOpen ? 'open' : ''}`}
              onClick={() => setChatOpen((v) => !v)}
            >
              ◈ {chatOpen ? 'Hide chat' : 'Show chat'}
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="dash-content">
          {error ? (
            <div className="error-state">
              <p>
                ⚠️ {error}
                {error.includes('API key') && (
                  <><br /><br />Make sure <code>ANTHROPIC_API_KEY</code> is set in your Vercel environment variables.</>
                )}
              </p>
              <button className="retry-btn" onClick={fetchData}>Try again</button>
            </div>
          ) : (
            <>
              <KPICards data={data} loading={loading} />
              <SpendChart data={data?.spendByDay} loading={loading} />
              <CampaignTable campaigns={data?.campaigns} loading={loading} />
            </>
          )}
        </div>
      </main>

      {chatOpen && <ChatPanel />}
    </div>
  );
}
