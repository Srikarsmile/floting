const DEFAULT_MODEL = '~google/gemini-flash-latest';
const DEFAULT_ALLOWED_ORIGINS = [
  'https://www.floatingcounselling.co.uk',
  'https://floatingcounselling.co.uk',
  'https://srikarsmile.github.io',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
];

const LANGUAGE_NAMES = {
  ar: 'Arabic',
  bn: 'Bengali',
  es: 'Spanish',
  fr: 'French',
  hi: 'Hindi',
  pa: 'Punjabi',
  pl: 'Polish',
  pt: 'Portuguese',
  ro: 'Romanian',
  so: 'Somali',
  ta: 'Tamil',
  te: 'Telugu',
  tr: 'Turkish',
  uk: 'Ukrainian',
  ur: 'Urdu',
  yo: 'Yoruba',
};

function allowedOrigins() {
  const configured = String(process.env.TRANSLATION_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return configured.length ? configured : DEFAULT_ALLOWED_ORIGINS;
}

function isAllowedVercelPreview(origin) {
  try {
    return new URL(origin).hostname.endsWith('.vercel.app');
  } catch (error) {
    return false;
  }
}

function isAllowedLocalOrigin(origin) {
  try {
    return ['localhost', '127.0.0.1', '::1'].includes(new URL(origin).hostname);
  } catch (error) {
    return false;
  }
}

function corsOrigin(origin) {
  if (!origin) return '';
  if (allowedOrigins().includes(origin) || isAllowedVercelPreview(origin) || isAllowedLocalOrigin(origin)) return origin;
  return '';
}

function sendJson(res, status, data, origin) {
  const allowOrigin = corsOrigin(origin);

  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Vary', 'Origin');
  if (allowOrigin) res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');

  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 64000) {
      throw new Error('request_too_large');
    }
  }

  return JSON.parse(body || '{}');
}

function normalizeLanguage(value) {
  const language = String(value || '').trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(LANGUAGE_NAMES, language) ? language : '';
}

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];

  return items
    .slice(0, 100)
    .map((item, index) => ({
      key: String(item && item.key !== undefined ? item.key : index).slice(0, 80),
      text: String(item && item.text ? item.text : '').replace(/\s+/g, ' ').trim().slice(0, 700),
    }))
    .filter((item) => item.text);
}

function parseModelJson(content) {
  const text = String(content || '').trim();

  try {
    return JSON.parse(text);
  } catch (error) {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) throw error;
    return JSON.parse(text.slice(start, end + 1));
  }
}

function normalizeModelTranslations(parsed, items) {
  const byKey = new Map();
  const translations = Array.isArray(parsed && parsed.translations) ? parsed.translations : [];

  translations.forEach((item, index) => {
    if (typeof item === 'string') {
      byKey.set(String(index), item);
      return;
    }

    if (item && item.key !== undefined && typeof item.text === 'string') {
      byKey.set(String(item.key), item.text);
    }
  });

  return items.map((item) => ({
    key: item.key,
    text: String(byKey.get(item.key) || item.text).replace(/\s+/g, ' ').trim(),
  }));
}

async function translateWithOpenRouter(payload) {
  const model = String(process.env.OPENROUTER_MODEL || DEFAULT_MODEL).trim();
  const targetName = LANGUAGE_NAMES[payload.targetLanguage];
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'https://www.floatingcounselling.co.uk/',
      'X-Title': process.env.OPENROUTER_SITE_NAME || 'Floating Counselling',
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      max_tokens: 8000,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: [
            'You translate public website interface copy for Floating Counselling, a UK charity.',
            `Translate English into ${targetName}.`,
            'Use clear, warm, respectful language suitable for counselling, family support, safeguarding, food support, and community services.',
            'Preserve organisation names, personal names, URLs, emails, phone numbers, prices, dates, times, and numbers.',
            'Do not add commentary. Return only JSON in this shape: {"translations":[{"key":"same-key","text":"translated text"}]}.',
          ].join(' '),
        },
        {
          role: 'user',
          content: JSON.stringify({
            targetLanguage: payload.targetLanguage,
            targetLanguageName: targetName,
            items: payload.items,
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorId = crypto.randomUUID();
    console.error(JSON.stringify({ errorId, provider: 'openrouter', status: response.status }));
    throw new Error(`OpenRouter request failed: ${errorId}`);
  }

  const data = await response.json();
  const content = data && data.choices && data.choices[0] && data.choices[0].message
    ? data.choices[0].message.content
    : '';

  return normalizeModelTranslations(parseModelJson(content), payload.items);
}

module.exports = async function translate(req, res) {
  const origin = req.headers.origin || '';

  if (req.method === 'OPTIONS') {
    sendJson(res, corsOrigin(origin) ? 204 : 403, {}, origin);
    return;
  }

  if (origin && !corsOrigin(origin)) {
    sendJson(res, 403, { error: 'Origin is not allowed' }, origin);
    return;
  }

  if (req.method === 'GET') {
    sendJson(res, 200, {
      ok: true,
      service: 'floating-translation',
      model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
    }, origin);
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' }, origin);
    return;
  }

  if (!process.env.OPENROUTER_API_KEY) {
    sendJson(res, 503, { error: 'Translation service is not configured' }, origin);
    return;
  }

  let body;
  try {
    body = await readBody(req);
  } catch (error) {
    sendJson(res, error && error.message === 'request_too_large' ? 413 : 400, { error: 'Request body must be valid JSON' }, origin);
    return;
  }

  const targetLanguage = normalizeLanguage(body.targetLanguage);
  const items = normalizeItems(body.items);
  const totalChars = items.reduce((total, item) => total + item.text.length, 0);

  if (!targetLanguage || !items.length || totalChars > 14000) {
    sendJson(res, 400, { error: 'Translation payload is invalid' }, origin);
    return;
  }

  try {
    const translations = await translateWithOpenRouter({ targetLanguage, items });
    sendJson(res, 200, { translations }, origin);
  } catch (error) {
    console.error(JSON.stringify({ error: String(error && error.message ? error.message : error) }));
    sendJson(res, 502, { error: 'Translation failed' }, origin);
  }
};
