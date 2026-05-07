'use client';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#111214',
      border: '1px solid #1c1e24',
      borderRadius: 8,
      padding: '10px 14px',
      fontFamily: 'var(--font-dm-mono, monospace)',
      fontSize: 12,
    }}>
      <p style={{ color: '#71717a', marginBottom: 6 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: ${Number(p.value).toFixed(0)}
        </p>
      ))}
    </div>
  );
};

const fmtDate = (str) => {
  if (!str) return '';
  const d = new Date(str);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const fmtY = (v) => {
  if (v >= 1000) return `$${(v / 1000).toFixed(0)}k`;
  return `$${v}`;
};

export default function SpendChart({ data, loading }) {
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Daily Spend</span>
        <div className="chart-legend" style={{ padding: 0, gap: 14 }}>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#1877F2' }} />
            Meta
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#34A853' }} />
            Google
          </div>
        </div>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 240, margin: 16, borderRadius: 8 }} />
      ) : !data?.length ? (
        <div className="no-data">No spend data available for this period.</div>
      ) : (
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1c1e24" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={fmtDate}
                tick={{ fill: '#52525b', fontSize: 11, fontFamily: 'var(--font-dm-mono, monospace)' }}
                axisLine={{ stroke: '#1c1e24' }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={fmtY}
                tick={{ fill: '#52525b', fontSize: 11, fontFamily: 'var(--font-dm-mono, monospace)' }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="meta"
                name="Meta"
                stroke="#1877F2"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#1877F2' }}
              />
              <Line
                type="monotone"
                dataKey="google"
                name="Google"
                stroke="#34A853"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#34A853' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
