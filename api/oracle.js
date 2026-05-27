// Edge Function — streams Anthropic SSE directly to the browser
// Prompt caching on the system message saves ~80% input tokens on repeated queries
export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { model, max_tokens, system, messages } = await req.json();

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type':        'application/json',
      'x-api-key':           process.env.ANTHROPIC_API_KEY,
      'anthropic-version':   '2023-06-01',
      'anthropic-beta':      'prompt-caching-2024-07-31',
    },
    body: JSON.stringify({
      model,
      max_tokens,
      // cache_control on the system prompt — the large KB gets cached for 5 min
      system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
      messages,
      stream: true,
    }),
  });

  if (!upstream.ok) {
    const err = await upstream.text();
    return new Response(err, { status: upstream.status, headers: { 'Content-Type': 'application/json' } });
  }

  // Pipe the SSE stream straight through
  return new Response(upstream.body, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}
