'use client';

const fmt = {
  currency: (n) => {
    if (n == null) return '—';
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
    return `$${Number(n).toFixed(0)}`;
  },
  roas: (n) => (n != null ? `${Number(n).toFixed(2)}x` : '—'),
  pct: (n) => (n != null ? `${Number(n).toFixed(2)}%` : '—'),
  num: (n) => {
    if (n == null) return '—';
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return `${Number(n).toFixed(0)}`;
  },
};

const CARDS = [
  {
    key: 'totalSpend',
    label: 'Total Spend',
    format: fmt.currency,
    sub: (d) => d ? `Meta ${fmt.currency(d.meta?.spend)} · Google ${fmt.currency(d.google?.spend)}` : null,
    accent: null,
  },
  {
    key: 'blendedROAS',
    label: 'Blended ROAS',
    format: fmt.roas,
    sub: (d) => d ? `Meta ${fmt.roas(d.meta?.roas)} · Google ${fmt.roas(d.google?.roas)}` : null,
    accent: null,
  },
  {
    key: 'totalConversions',
    label: 'Conversions',
    format: fmt.num,
    sub: (d) => d ? `Meta ${fmt.num(d.meta?.conversions)} · Google ${fmt.num(d.google?.conversions)}` : null,
    accent: null,
  },
  {
    key: 'ga4Sessions',
    label: 'GA4 Sessions',
    format: fmt.num,
    sub: (d) => d ? `Conv. rate ${fmt.pct(d.ga4?.conversionRate)}` : null,
    accent: '#f59e0b',
    platform: 'GA4',
  },
  {
    key: 'avgCTR',
    label: 'Avg CTR',
    format: fmt.pct,
    sub: (d) => d ? `Meta ${fmt.pct(d.meta?.ctr)} · Google ${fmt.pct(d.google?.ctr)}` : null,
    accent: null,
  },
  {
    key: 'avgCPC',
    label: 'Avg CPC',
    format: fmt.currency,
    sub: (d) => d ? `Meta ${fmt.currency(d.meta?.cpc)} · Google ${fmt.currency(d.google?.cpc)}` : null,
    accent: null,
  },
];

export default function KPICards({ data, loading }) {
  if (loading) {
    return (
      <div className="kpi-grid">
        {Array(6).fill(0).map((_, i) => (
          <div key={i} className="kpi-card">
            <div className="skeleton kpi-skeleton" />
          </div>
        ))}
      </div>
    );
  }

  const summary = data?.summary || {};

  return (
    <div className="kpi-grid">
      {CARDS.map((card) => (
        <div key={card.key} className="kpi-card">
          <div className="kpi-label">
            {card.platform && (
              <span
                className="platform-dot"
                style={{ background: card.accent || '#71717a' }}
              />
            )}
            {card.label}
          </div>
          <div className="kpi-value">
            {card.format(summary[card.key])}
          </div>
          {card.sub(data) && (
            <div className="kpi-breakdown">{card.sub(data)}</div>
          )}
        </div>
      ))}
    </div>
  );
}
