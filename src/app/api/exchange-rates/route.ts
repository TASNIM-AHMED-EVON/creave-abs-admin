import { NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// GET /api/exchange-rates?base=BDT
//
// A tiny server-side proxy in front of currencyapi.com. This is the ONLY
// place the API key is ever read — it never reaches the browser, because
// this file runs on the server (Next.js Route Handlers always do, even
// though the rest of this app is a 'use client' page).
//
// Setup:
//   1. Add CURRENCY_API_KEY to your environment variables:
//        - Locally: create/edit .env.local in the project root, add:
//            CURRENCY_API_KEY=your_key_from_currencyapi.com
//        - On Vercel: Project → Settings → Environment Variables → add
//          CURRENCY_API_KEY (Production + Preview), then redeploy.
//   2. Do NOT prefix it with NEXT_PUBLIC_ — that prefix is what tells
//      Next.js to bundle a variable into client-side JS, which would put
//      your key in plain text in every visitor's browser devtools.
// ---------------------------------------------------------------------------
export async function GET(request: Request) {
  const apiKey = process.env.CURRENCY_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'CURRENCY_API_KEY is not set on the server. Add it to .env.local (dev) or your host\'s environment variables (production), then redeploy.' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const base = searchParams.get('base') || 'BDT';

  try {
    const res = await fetch(
      `https://api.currencyapi.com/v3/latest?apikey=${apiKey}&base_currency=${encodeURIComponent(base)}`,
      { cache: 'no-store' } // always fetch fresh — this is only called when the admin clicks "Refresh Rates"
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `currencyapi.com returned ${res.status}: ${text}` }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to reach currencyapi.com. Check your network/DNS and try again.' }, { status: 502 });
  }
}
