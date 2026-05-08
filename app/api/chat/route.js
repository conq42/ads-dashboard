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

const SYSTEM = `You are AdsAI, a senior digital marketing analyst for an agency. You have direct access to Meta Ads, Google Ads, Google Merchant Center, and GA4 data through connected tools.

Guidelines:
- Always fetch real data before answering — never estimate or guess
- Present data in markdown tables for easy scanning
- Highlight anomalies, budget waste, and clear opportunities
- Be direct and concise — agency teams need quick answers
- Add context to numbers (vs prior period, vs target) when available`;

export async function POST(request) {
  try {
    const { messages } = await request.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured.' }, { status: 500 });
    }

    const authToken = await getGoogleIdentityToken();

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
        system: SYSTEM,
        messages,
        mcp_servers: [{ type: 'url', url: MCP_SERVER_URL, name: 'ad-manager', authorization_token: authToken }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    const content = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
    return NextResponse.json({ content: content || 'No response. Please try again.' });
  } catch (err) {
    console.error('Chat error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
