// Lightweight Pollinations client (ES module)
// Usage:
//   import * as Pollinations from './api/pollinations.js'
//   await Pollinations.generateImage(prompt, apiKey, {model:'seedream', width:1024})
//   await Pollinations.chatCompletion(messagesArray, apiKey, {model:'openai'})
export async function chatCompletion(messages, apiKey, opts = {}) {
  const model = opts.model || 'openai';
  const url = 'https://gen.pollinations.ai/v1/chat/completions';
  const body = {
    model,
    messages,
    modalities: ['text'],
    temperature: opts.temperature ?? 1,
    max_tokens: opts.max_tokens ?? 1024
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (res.status === 401) {
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }
  if (res.status === 429) {
    const err = new Error('Rate limited');
    err.isRateLimit = true;
    err.status = 429;
    throw err;
  }
  if (!res.ok) {
    const text = await res.text();
    const err = new Error('Pollinations chat error: ' + res.status + ' ' + text);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  return data;
}

export async function generateText(prompt, apiKey, opts = {}) {
  const model = opts.model || 'openai';
  const q = new URLSearchParams({
    model,
    temperature: String(opts.temperature ?? 1),
    json: String(opts.json ?? false)
  });
  const url = `https://gen.pollinations.ai/text/${encodeURIComponent(prompt)}?${q.toString()}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`
    }
  });
  if (res.status === 401) {
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }
  if (res.status === 429) {
    const err = new Error('Rate limited');
    err.isRateLimit = true;
    err.status = 429;
    throw err;
  }
  if (!res.ok) {
    const text = await res.text();
    const err = new Error('Pollinations text error: ' + res.status + ' ' + text);
    err.status = res.status;
    throw err;
  }
  const text = await res.text();
  return { text };
}

export async function generateImage(prompt, apiKey, opts = {}) {
  const model = opts.model || 'seedream';
  const params = new URLSearchParams();
  params.set('model', model);
  if (opts.width) params.set('width', String(opts.width));
  if (opts.height) params.set('height', String(opts.height));
  if (opts.quality) params.set('quality', opts.quality);
  if (opts.enhance !== undefined) params.set('enhance', String(Boolean(opts.enhance)));
  if (opts.guidance_scale !== undefined) params.set('guidance_scale', String(opts.guidance_scale));

  const url = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?${params.toString()}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`
    }
  });

  if (res.status === 401) {
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }
  if (res.status === 429) {
    const err = new Error('Rate limited');
    err.isRateLimit = true;
    err.status = 429;
    throw err;
  }
  if (!res.ok) {
    const text = await res.text();
    const err = new Error('Pollinations image error: ' + res.status + ' ' + text);
    err.status = res.status;
    throw err;
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  return { objectUrl, blob, contentType: res.headers.get('Content-Type') };
      }
