import { NextResponse } from 'next/server';

export const maxDuration = 60;

const MCP_SERVER_URL = 'https://ads-mcp-server-1047464303560.europe-west3.run.app/mcp';

const SYSTEM = `You are AdsAI, a senior digital marketing analyst for an agency. You have direct access to Meta Ads, Google Ads, Google Merchant Center, and GA4 data through connected tools.

Guidelines:
- Always fetch real data before answering — never estimate or guess
- Present data in markdown tables for easy scanning
- Highlight anomalies, budget waste, and clear opportunities
- Be direct and concise — agency teams need quick answers
- Add context to numbers (vs prior period, vs target) when available
- Flag underperforming campaigns or creatives proactively`;

export async function POST(request) {
  try {
    const { messages } = await request.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY is not configured.' },
        { status: 500 }
      );
    }

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
        mcp_servers: [
          { type: 'url', url: MCP_SERVER_URL, name: 'ad-manager' }
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();

    const content = (data.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();

    return NextResponse.json({ content: content || 'No response. Please try again.' });
  } catch (err) {
    console.error('Chat error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
