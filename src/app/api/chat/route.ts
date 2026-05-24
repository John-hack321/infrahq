import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  console.log('[chat route] Request received');
  
  try {
    const body = await req.json();
    console.log('[chat route] Body parsed:', body);

    const response = await fetch('https://infraredn8n.onrender.com/webhook/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: body.message }),
    });

    console.log('[chat route] n8n response status:', response.status);
    const text = await response.text();
    console.log('[chat route] n8n response text:', text);

    return new NextResponse(text, {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[chat route] ERROR:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}