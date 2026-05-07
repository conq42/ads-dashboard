'use client';
import { useState } from 'react';

const fmt = {
  currency: (n) => (n != null ? `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '—'),
  roas: (n) => (n != null ? `${Number(n).toFixed(2)}x` : '—'),
  pct: (n) => (n != null ? `${Number(n).toFixed(2)}%` : '—'),
  num: (n) => (n != null ? Number(n).toLocaleString() : '—'),
};

const COLS = [
  { key: 'name', label: 'Campaign', sortable: false },
  { key: 'platform', label: 'Platform', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'spend', label: 'Spend', sortable: true, format: fmt.currency },
  { key: 'roas', label: 'ROAS', sortable: true, format: fmt.roas },
  { key: 'ctr', label: 'CTR', sortable: true, format: fmt.pct },
  { key: 'conversions', label: 'Conv.', sortable: true, format: fmt.num },
];

export default function CampaignTable({ campaigns, loading }) {
  const [sortKey, setSortKey] = useState('spend');
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (key) => {
    if (!COLS.find((c) => c.key === key)?.sortable) return;
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = campaigns
    ? [...campaigns].sort((a, b) => {
        const av = a[sortKey], bv = b[sortKey];
        if (typeof av === 'string') {
          return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
        }
        return sortDir === 'asc' ? (av ?? 0) - (bv ?? 0) : (bv ?? 0) - (av ?? 0);
      })
    : [];

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Campaigns</span>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-dm-mono)', color: 'var(--text-dim)' }}>
          {sorted.length > 0 ? `${sorted.length} campaigns` : ''}
        </span>
      </div>

      {loading ? (
        <div className="skeleton table-skeleton" />
      ) : !sorted.length ? (
        <div className="no-data">No campaign data available.</div>
      ) : (
        <div className="table-wrap">
          <table className="campaign-table">
            <thead>
              <tr>
                {COLS.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    style={{ cursor: col.sortable ? 'pointer' : 'default' }}
                  >
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      <span style={{ marginLeft: 4 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, i) => (
                <tr key={i}>
                  <td className="td-name" title={row.name}>{row.name || '—'}</td>
                  <td>
                    <span className={`platform-badge ${row.platform}`}>
                      {row.platform === 'meta' ? '⬡ Meta' : row.platform === 'google' ? '⬡ Google' : row.platform}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${row.status || 'paused'}`}>
                      {row.status || 'unknown'}
                    </span>
                  </td>
                  <td className="td-mono">{fmt.currency(row.spend)}</td>
                  <td className="td-mono">{fmt.roas(row.roas)}</td>
                  <td className="td-mono">{fmt.pct(row.ctr)}</td>
                  <td className="td-mono">{fmt.num(row.conversions)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
