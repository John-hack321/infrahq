import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  const response = await fetch('https://infraredn8n.onrender.com/webhook/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  const text = await response.text();
  return new NextResponse(text, {
    headers: { 'Content-Type': 'application/json' },
  });
}