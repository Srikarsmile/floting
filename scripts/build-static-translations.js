#!/usr/bin/env node
'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_OUT_DIR = path.join(ROOT, 'translations');
const DEFAULT_ENDPOINT = 'https://floting.vercel.app/api/translate';
const DEFAULT_CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BATCH_MAX_ITEMS = 35;
const BATCH_MAX_CHARS = 4500;
const TRANSLATION_ARTIFACT_PATTERN = /\[\[[^\]]+\]\]+|[A-Z]*XTERM\s*\d+\s*XCF/i;

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

const PROTECTED_TERMS = [
  'Floating Counselling Community',
  'Floating Counselling',
  'Impact Parenting Pillar',
  'Impact Parenting',
  'Ask Floating',
  'MyFamily101',
  'Myfamily101',
  'Localgiving',
  'PayPal',
  'Monday.com',
  'WhatsApp',
  'Facebook',
  'Instagram',
  'Twitter / X',
  'Twitter',
  'YouTube',
  'BACP',
  'ICO',
  'GDPR',
  'NSPCC',
  'Croydon',
  'Redbridge',
  'Newham',
  'Durham',
  'Southwark',
  'Ashburton Park Cafe Hall',
  'Ashburton Park',
  'Cranbrook House',
  'Cranbrook Road',
  'Wesley Street',
  'Heaton Road',
  'Peckham',
  'Ilford',
  'London',
  'UK',
  'United Kingdom',
  'Celestina Oniye-Thomas',
  'Omowonu-Ola Ogunlela',
  'Elizabeth Owode',
  'Linda Yeboah',
].sort((a, b) => b.length - a.length);

function protectedToken(index) {
  return `FCXTERM${index}XCF`;
}

function protectText(text) {
  return PROTECTED_TERMS.reduce(
    (value, term, index) => value.split(term).join(protectedToken(index)),
    String(text || ''),
  );
}

function restoreProtectedText(text) {
  return String(text || '').replace(/[A-Z]*XTERM\s*(\d+)\s*XCF/gi, (match, index) => {
    const term = PROTECTED_TERMS[Number(index)];
    return term || match;
  });
}

function hasTranslationArtifact(value) {
  return TRANSLATION_ARTIFACT_PATTERN.test(String(value || ''));
}

function parseArgs(argv) {
  return argv.reduce((options, arg) => {
    if (!arg.startsWith('--')) return options;
    const [rawKey, ...valueParts] = arg.slice(2).split('=');
    const key = rawKey.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    options[key] = valueParts.length ? valueParts.join('=') : true;
    return options;
  }, {});
}

function hashString(value) {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) + hash) ^ value.charCodeAt(index);
  }
  return (hash >>> 0).toString(36);
}

function contentType(filePath) {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filePath.endsWith('.js')) return 'application/javascript; charset=utf-8';
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filePath.endsWith('.json')) return 'application/json; charset=utf-8';
  if (filePath.endsWith('.svg')) return 'image/svg+xml';
  if (filePath.endsWith('.webp')) return 'image/webp';
  if (filePath.endsWith('.png')) return 'image/png';
  if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) return 'image/jpeg';
  return 'application/octet-stream';
}

function startServer() {
  const server = http.createServer((req, res) => {
    const requestUrl = new URL(req.url, 'http://127.0.0.1');
    const requestedPath = requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname;
    const filePath = path.resolve(ROOT, `.${decodeURIComponent(requestedPath)}`);

    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    fs.readFile(filePath, (error, body) => {
      if (error) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      res.writeHead(200, {
        'Content-Type': contentType(filePath),
        'Access-Control-Allow-Origin': '*',
      });
      res.end(body);
    });
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({ server, url: `http://127.0.0.1:${address.port}/` });
    });
  });
}

async function collectSourceEntries(sourceUrl) {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (error) {
    throw new Error('Playwright is required. Run with NODE_PATH pointing at the bundled Codex node_modules.');
  }

  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_EXECUTABLE || DEFAULT_CHROME,
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1400 } });
    await page.goto(sourceUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2500);
    await page.waitForFunction(() => {
      const host = document.querySelector('floating-home');
      const root = host && host.shadowRoot ? host.shadowRoot : document;
      const text = root === document ? document.documentElement.textContent : root.textContent;
      return /Counselling/.test(text || '');
    }, null, { timeout: 60000 });

    const entries = await page.evaluate(() => {
      const TEXT_ATTRS = ['aria-label', 'alt', 'placeholder', 'title'];
      const SKIP_SELECTOR = [
        'script',
        'style',
        'noscript',
        'svg',
        'canvas',
        'iframe',
        'video',
        'audio',
        'input',
        'textarea',
        '[data-no-translate]',
        '[translate="no"]',
        '.notranslate',
        '.language-select',
        '.cursor-dot',
        '.cursor-ring',
      ].join(',');

      function cleanText(value) {
        return String(value || '').replace(/\s+/g, ' ').trim();
      }

      function hasWords(value) {
        return /[A-Za-z]/.test(value || '');
      }

      function shouldSkipElement(element) {
        return Boolean(element && element.closest && element.closest(SKIP_SELECTOR));
      }

      const host = document.querySelector('floating-home');
      const root = host && host.shadowRoot ? host.shadowRoot : document;
      const entries = [];
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          const parent = node.parentElement;
          if (!parent || shouldSkipElement(parent)) return NodeFilter.FILTER_REJECT;
          const normalized = cleanText(node.nodeValue || '');
          if (!hasWords(normalized)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      });

      let textNode = walker.nextNode();
      while (textNode) {
        entries.push({ key: `t${entries.length}`, text: cleanText(textNode.nodeValue || '') });
        textNode = walker.nextNode();
      }

      root.querySelectorAll && root.querySelectorAll('*').forEach((element) => {
        if (shouldSkipElement(element)) return;

        TEXT_ATTRS.forEach((name) => {
          const value = element.getAttribute(name);
          if (!value || !hasWords(value)) return;
          entries.push({ key: `a${entries.length}`, text: cleanText(value) });
        });
      });

      return entries;
    });

    const sourceHash = hashString(entries.map((entry) => entry.text).join('\u001f'));
    return { entries, sourceHash };
  } finally {
    await browser.close();
  }
}

function createBatches(entries) {
  const batches = [];
  let current = [];
  let currentChars = 0;

  entries.forEach((entry) => {
    const chars = Math.min(String(entry.text || '').length, 700);
    const startNext = current.length > 0 && (
      current.length >= BATCH_MAX_ITEMS ||
      currentChars + chars > BATCH_MAX_CHARS
    );

    if (startNext) {
      batches.push(current);
      current = [];
      currentChars = 0;
    }

    current.push(entry);
    currentChars += chars;
  });

  if (current.length) batches.push(current);
  return batches;
}

async function translateBatch(endpoint, language, batch) {
  let data;
  let lastError = null;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceLanguage: 'en',
        targetLanguage: language,
        targetLanguageName: LANGUAGE_NAMES[language],
        pageUrl: 'https://www.floatingcounselling.co.uk/',
        items: batch.map((entry) => ({ key: entry.key, text: entry.text.slice(0, 700) })),
      }),
    });

    if (response.ok) {
      data = await response.json();
      lastError = null;
      break;
    }

    const detail = await response.text().catch(() => '');
    lastError = new Error(`Translation failed for ${language}: ${response.status} ${detail.slice(0, 180)}`);
    await new Promise((resolve) => setTimeout(resolve, 800 * attempt));
  }

  if (lastError) {
    if (batch.length > 12) {
      const midpoint = Math.ceil(batch.length / 2);
      const first = await translateBatch(endpoint, language, batch.slice(0, midpoint));
      const second = await translateBatch(endpoint, language, batch.slice(midpoint));
      return first.concat(second);
    }

    const sample = batch
      .slice(0, 4)
      .map((entry) => `${entry.key}: ${entry.text.slice(0, 90)}`)
      .join(' | ');
    throw new Error(`${lastError.message}; failed keys ${batch.map((entry) => entry.key).join(', ')}; sample ${sample}`);
  }

  const byKey = new Map();
  (Array.isArray(data.translations) ? data.translations : []).forEach((item, index) => {
    if (typeof item === 'string') {
      byKey.set(String(index), item);
      return;
    }

    if (item && item.key !== undefined && typeof item.text === 'string') {
      byKey.set(String(item.key), item.text);
    }
  });

  return batch.map((entry) => ({
    key: entry.key,
    source: entry.text,
    text: String(byKey.get(entry.key) || entry.text).replace(/\s+/g, ' ').trim(),
  }));
}

async function translateWithGoogle(language, text) {
  const params = new URLSearchParams({
    client: 'gtx',
    sl: 'en',
    tl: language,
    dt: 't',
    q: text,
  });
  const response = await fetch(`https://translate.googleapis.com/translate_a/single?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Static translation fallback failed for ${language}: ${response.status}`);
  }

  const data = await response.json();
  const translated = Array.isArray(data && data[0])
    ? data[0].map((part) => Array.isArray(part) ? part[0] : '').join('')
    : '';

  return restoreProtectedText(translated || text).replace(/\s+/g, ' ').trim();
}

async function translateBatchWithGoogle(language, batch) {
  const joined = batch.map((entry) => `[[[${entry.key}]]] ${protectText(entry.text)}`).join('\n');
  const translatedBlock = await translateWithGoogle(language, joined);
  const byKey = new Map();
  const markerPattern = /\[\[\[([^\]]+)\]\]\]\s*([\s\S]*?)(?=\s*\[\[\[[^\]]+\]\]\]|$)/g;
  let match = markerPattern.exec(translatedBlock);

  while (match) {
    byKey.set(match[1], String(match[2] || '').replace(/\s+/g, ' ').trim());
    match = markerPattern.exec(translatedBlock);
  }

  const invalid = batch.filter((entry) => !byKey.has(entry.key) || hasTranslationArtifact(byKey.get(entry.key)));

  for (const entry of invalid) {
    byKey.set(entry.key, await translateWithGoogle(language, entry.text));
  }

  return batch.map((entry) => ({
    key: entry.key,
    source: entry.text,
    text: String(byKey.get(entry.key) || entry.text).replace(/\s+/g, ' ').trim(),
  }));
}

function compactTranslations(translations) {
  return translations.map((item) => ({
    key: item.key,
    source: item.source,
    text: item.text,
  }));
}

function writeJson(filePath, data, compact = false) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(`${filePath}.tmp`, `${JSON.stringify(data, null, compact ? 0 : 2)}\n`);
  fs.renameSync(`${filePath}.tmp`, filePath);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const endpoint = String(options.endpoint || DEFAULT_ENDPOINT).trim();
  const provider = String(options.provider || 'floating').trim().toLowerCase();
  const outDir = path.resolve(ROOT, String(options.outDir || 'translations').trim());
  const selectedLanguages = String(options.languages || Object.keys(LANGUAGE_NAMES).join(','))
    .split(',')
    .map((language) => language.trim().toLowerCase())
    .filter((language) => LANGUAGE_NAMES[language]);
  const force = Boolean(options.force);
  let localServer = null;
  let sourceUrl = String(options.sourceUrl || '').trim();

  if (!sourceUrl) {
    const started = await startServer();
    localServer = started.server;
    sourceUrl = started.url;
  }

  try {
    console.log(`Collecting source text from ${sourceUrl}`);
    const { entries, sourceHash } = await collectSourceEntries(sourceUrl);
    console.log(`Collected ${entries.length} translatable entries (${sourceHash})`);

    fs.mkdirSync(outDir, { recursive: true });
    const manifestPathFor = (filePath) => path.relative(ROOT, filePath).split(path.sep).join('/');

    writeJson(path.join(outDir, 'source.json'), {
      sourceLanguage: 'en',
      sourceHash,
      sourceUrl,
      generatedAt: new Date().toISOString(),
      entries,
    });

    const manifest = {
      sourceLanguage: 'en',
      sourceHash,
      generatedAt: new Date().toISOString(),
      languages: {},
    };

    const batches = createBatches(entries);
    for (const language of selectedLanguages) {
      const outputPath = path.join(outDir, `${language}.json`);
      if (!force && fs.existsSync(outputPath)) {
        try {
          const existing = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
          if (existing.sourceHash === sourceHash && existing.language === language) {
            manifest.languages[language] = manifestPathFor(outputPath);
            console.log(`Skipping ${language}; existing file is current`);
            continue;
          }
        } catch (error) {
          // Regenerate malformed files.
        }
      }

      console.log(`Translating ${language} (${LANGUAGE_NAMES[language]}) in ${batches.length} batches via ${provider}`);
      const translated = [];
      for (let index = 0; index < batches.length; index += 1) {
        const batchTranslations = provider === 'google'
          ? await translateBatchWithGoogle(language, batches[index])
          : await translateBatch(endpoint, language, batches[index]);
        translated.push(...batchTranslations);
        console.log(`  ${language}: batch ${index + 1}/${batches.length}`);
      }

      writeJson(outputPath, {
        language,
        sourceHash,
        translations: compactTranslations(translated),
      }, true);
      manifest.languages[language] = manifestPathFor(outputPath);
    }

    writeJson(path.join(outDir, 'manifest.json'), manifest);
  } finally {
    if (localServer) {
      await new Promise((resolve) => localServer.close(resolve));
    }
  }
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
