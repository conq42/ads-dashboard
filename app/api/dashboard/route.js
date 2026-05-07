import { NextResponse } from 'next/server';

// Increase timeout for Vercel (requires Pro plan for > 10s)
export const maxDuration = 60;

const MCP_SERVER_URL = 'https://ads-mcp-server-1047464303560.europe-west3.run.app/mcp';

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
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not set. Add it to Vercel environment variables.' },
      { status: 500 }
    );
  }

  const prompt = `Today is ${today}. Fetch ad performance data for the last ${rangeDays} days across Meta Ads, Google Ads, and GA4.

Collect:
1. Meta Ads: total spend, ROAS, CTR, conversions, impressions, CPC + top 10 campaigns with individual spend/ROAS/CTR/conversions/status
2. Google Ads: same metrics + top 10 campaigns
3. GA4: sessions, conversions, revenue, conversion rate
4. Daily spend breakdown for each day in the range (Meta and Google separately)

Compute summary: totalSpend = meta spend + google spend, blendedROAS = total revenue / total spend, totalConversions = meta + google conversions, avgCTR and avgCPC as weighted averages.

Return ONLY a valid JSON object — no markdown, no backticks, no explanation. Use exactly this structure:
${SCHEMA}

Use null for any values you cannot fetch. Round all numbers to 2 decimal places maximum.`;

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
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: 'You are a data fetching assistant. You use tools to retrieve ad performance data and return ONLY valid JSON. Never include markdown formatting, backticks, or explanatory text in your response — only the raw JSON object.',
        messages: [{ role: 'user', content: prompt }],
        mcp_servers: [
          { type: 'url', url: MCP_SERVER_URL, name: 'ad-manager' }
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Anthropic API error: ${response.status}`);
    }

    const apiData = await response.json();

    // Extract text content
    const rawText = (apiData.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();

    if (!rawText) {
      throw new Error('No data returned from AI. Try refreshing.');
    }

    // Strip any accidental markdown fences
    const cleaned = rawText.replace(/```json|```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // If JSON parsing fails, return the raw text as an error for debugging
      console.error('Failed to parse dashboard JSON:', cleaned.slice(0, 500));
      throw new Error('Could not parse data response. The AI may have returned an unexpected format.');
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error('Dashboard API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
