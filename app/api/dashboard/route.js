import { NextResponse } from 'next/server';

export const maxDuration = 60;

const MCP_SERVER_URL = 'https://ads-mcp-server-1047464303560.europe-west3.run.app/mcp';
const MCP_AUDIENCE = 'https://ads-mcp-server-1047464303560.europe-west3.run.app';

async function getGoogleIdentityToken() {
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!email || !privateKey) return null;

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: email,
    sub: email,
    aud: 'https://oauth2.googleapis.com/token',
    target_audience: MCP_AUDIENCE,
    iat: now,
    exp: now + 3600,
  };

  const toBase64Url = (str) => btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const header = toBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const body = toBase64Url(unescape(encodeURIComponent(JSON.stringify(payload))));
  const signingInput = `${header}.${body}`;

  const keyData = privateKey.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '');
  const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', binaryKey.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5', cryptoKey,
    new TextEncoder().encode(signingInput)
  );

  const sig = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const jwt = `${signingInput}.${sig}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  return tokenData.id_token || null;
}

const SCHEMA = `{
  "summary": {
    "totalSpend": number,
    "blendedROAS": number,
    "totalConversions": number,
    "avgCTR": number,
    "avgCPC": number,
    "ga4Sessions": number,
    "ga4Revenue": number,
    "ga4ConversionRate": number
  },
  "meta": {
    "spend": number,
    "roas": number,
    "ctr": number,
    "conversions": number,
    "impressions": number,
    "cpc": number
  },
  "google": {
    "spend": number,
    "roas": number,
    "ctr": number,
    "conversions": number,
    "impressions": number,
    "cpc": number
  },
  "ga4": {
    "sessions": number,
    "conversions": number,
    "revenue": number,
    "conversionRate": number
  },
  "spendByDay": [
    { "date": "YYYY-MM-DD", "meta": number, "google": number }
  ],
  "campaigns": [
    {
      "name": string,
      "platform": "meta" | "google",
      "status": "active" | "paused" | "ended",
      "spend": number,
      "roas": number,
      "ctr": number,
      "conversions": number
    }
  ]
}`;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || '30d';
  const rangeDays = { '7d': 7, '30d': 30, '90d': 90 }[range] || 30;
  const today = new Date().toISOString().split('T')[0];

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not set.' }, { status: 500 });
  }

  const authToken = await getGoogleIdentityToken();

  const prompt = `Today is ${today}. Fetch ad performance data for the last ${rangeDays} days across Meta Ads, Google Ads, and GA4.

Collect:
1. Meta Ads: total spend, ROAS, CTR, conversions, impressions, CPC + top 10 campaigns
2. Google Ads: same metrics + top 10 campaigns
3. GA4: sessions, conversions, revenue, conversion rate
4. Daily spend breakdown for each day in the range (Meta and Google separately)

Return ONLY a valid JSON object — no markdown, no backticks, no explanation. Use exactly this structure:
${SCHEMA}

Use null for any values you cannot fetch.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'mcp-client-2025-04-04',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: 'You are a data fetching assistant. Return ONLY valid JSON, no markdown, no backticks.',
        messages: [{ role: 'user', content: prompt }],
        mcp_servers: [{ type: 'url', url: MCP_SERVER_URL, name: 'ad-manager', authorization_token: authToken }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `API error: ${response.status}`);
    }

    const apiData = await response.json();
    const rawText = (apiData.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
    if (!rawText) throw new Error('No data returned.');

    const cleaned = rawText.replace(/```json|```/g, '').trim();
    return NextResponse.json(JSON.parse(cleaned));
  } catch (err) {
    console.error('Dashboard API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
