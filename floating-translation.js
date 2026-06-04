(function () {
  'use strict';

  const LANGUAGE_NAMES = {
    ar: 'Arabic',
    bn: 'Bengali',
    en: 'English',
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

  const BATCH_MAX_ITEMS = 100;
  const BATCH_MAX_CHARS = 12000;
  const MAX_PARALLEL_BATCHES = 3;
  const CACHE_VERSION = 'floating-translation-v2';
  const STATIC_TRANSLATION_VERSION = '20260604-04';
  const TRANSLATION_ARTIFACT_PATTERN = /\[\[[^\]]+\]\]+|[A-Z]*XTERM\s*\d+\s*XCF/i;
  const RTL_LANGUAGES = new Set(['ar', 'ur']);
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

  function languageName(code) {
    return LANGUAGE_NAMES[code] || code;
  }

  function hasWords(value) {
    return /[A-Za-z]/.test(value || '');
  }

  function cleanText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function hasTranslationArtifact(value) {
    return TRANSLATION_ARTIFACT_PATTERN.test(String(value || ''));
  }

  function isUsableTranslationText(value) {
    const text = cleanText(value);
    return Boolean(text) && !hasTranslationArtifact(text);
  }

  function deferWork() {
    return new Promise((resolve) => {
      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(resolve, { timeout: 350 });
        return;
      }

      window.requestAnimationFrame(() => window.setTimeout(resolve, 0));
    });
  }

  function writeNextFrame(callback) {
    window.requestAnimationFrame(callback);
  }

  function splitWhitespace(value) {
    const match = String(value || '').match(/^(\s*)([\s\S]*?)(\s*)$/);
    return {
      before: match ? match[1] : '',
      text: match ? match[2] : String(value || ''),
      after: match ? match[3] : '',
    };
  }

  function shouldSkipElement(element) {
    return Boolean(element && element.closest && element.closest(SKIP_SELECTOR));
  }

  function hashString(value) {
    let hash = 5381;
    for (let index = 0; index < value.length; index += 1) {
      hash = ((hash << 5) + hash) ^ value.charCodeAt(index);
    }
    return (hash >>> 0).toString(36);
  }

  function getStorage() {
    try {
      const storage = window.localStorage;
      const testKey = '__floating_translation_test__';
      storage.setItem(testKey, '1');
      storage.removeItem(testKey);
      return storage;
    } catch (error) {
      return null;
    }
  }

  function readCached(cacheKey) {
    const storage = getStorage();
    if (!storage) return null;

    try {
      return JSON.parse(storage.getItem(cacheKey) || 'null');
    } catch (error) {
      storage.removeItem(cacheKey);
      return null;
    }
  }

  function writeCached(cacheKey, value) {
    const storage = getStorage();
    if (!storage) return;

    try {
      storage.setItem(cacheKey, JSON.stringify(value));
    } catch (error) {
      // The page can still translate without local caching.
    }
  }

  function endpointFromPage(select) {
    const selectEndpoint = select && select.getAttribute('data-translation-endpoint');
    if (selectEndpoint) return selectEndpoint.trim();

    const config = window.FloatingTranslationConfig || {};
    if (typeof config.endpoint === 'string' && config.endpoint.trim()) {
      return config.endpoint.trim();
    }

    if (typeof window.FloatingTranslationEndpoint === 'string' && window.FloatingTranslationEndpoint.trim()) {
      return window.FloatingTranslationEndpoint.trim();
    }

    const meta = document.querySelector('meta[name="floating-translation-endpoint"]');
    return meta && meta.content ? meta.content.trim() : '';
  }

  function staticBaseFromPage(select) {
    const selectBase = select && select.getAttribute('data-translation-static-base');
    if (selectBase) return selectBase.trim();

    const config = window.FloatingTranslationConfig || {};
    if (typeof config.staticBase === 'string' && config.staticBase.trim()) {
      return config.staticBase.trim();
    }

    if (typeof window.FloatingTranslationStaticBase === 'string' && window.FloatingTranslationStaticBase.trim()) {
      return window.FloatingTranslationStaticBase.trim();
    }

    const meta = document.querySelector('meta[name="floating-translation-static-base"]');
    return meta && meta.content ? meta.content.trim() : '';
  }

  function pageUrlWithoutHash() {
    const url = new URL(window.location.href);
    url.hash = '';
    return url.toString();
  }

  function normalizeBaseUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';

    try {
      const url = new URL(raw, pageUrlWithoutHash()).toString();
      return url.endsWith('/') ? url : `${url}/`;
    } catch (error) {
      return '';
    }
  }

  function ensureStatus(select) {
    const existing = select.parentElement && select.parentElement.querySelector('.translation-status');
    if (existing) return existing;

    const status = document.createElement('span');
    status.className = 'translation-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('data-no-translate', '');
    status.hidden = true;
    select.insertAdjacentElement('afterend', status);
    return status;
  }

  function setStatus(status, message, state) {
    if (!status) return;
    status.textContent = message || '';
    status.dataset.state = state || '';
    status.hidden = !message;
  }

  function setDocumentLanguage(root, language) {
    const direction = RTL_LANGUAGES.has(language) ? 'rtl' : 'ltr';

    if (root && root.host && root.host.setAttribute) {
      root.host.setAttribute('lang', language);
      root.host.setAttribute('dir', direction);
      return;
    }

    document.documentElement.lang = language;
    document.documentElement.dir = direction;
  }

  function unlockPageScroll(root) {
    const ownerDocument = root && root.ownerDocument ? root.ownerDocument : document;
    const doc = ownerDocument.documentElement;
    const body = ownerDocument.body;

    if (doc) {
      doc.classList.remove('floating-nav-open');
      doc.style.removeProperty('overflow');
      doc.style.removeProperty('overflow-y');
    }

    if (body) {
      body.classList.remove('nav-open', 'floating-nav-open');
      body.style.removeProperty('overflow');
      body.style.removeProperty('overflow-y');
    }
  }

  async function requestTranslations(endpoint, payload) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Translation request failed (${response.status})`);
    }

    const data = await response.json();
    if (!data || !Array.isArray(data.translations)) {
      throw new Error('Translation response was not usable');
    }

    return data.translations;
  }

  function normalizeTranslations(translations) {
    const map = new Map();
    translations.forEach((item, index) => {
      if (typeof item === 'string') {
        if (isUsableTranslationText(item)) map.set(String(index), item);
        return;
      }

      if (item && item.key !== undefined && typeof item.text === 'string') {
        if (isUsableTranslationText(item.text)) map.set(String(item.key), item.text);
      }
    });
    return map;
  }

  function sanitizeStaticTranslations(translations) {
    const sanitized = [];

    translations.forEach((item, index) => {
      const key = item && item.key !== undefined ? String(item.key) : String(index);
      const text = typeof item === 'string' ? item : item && item.text;
      if (!isUsableTranslationText(text)) return;
      sanitized.push({ key, text });
    });

    return sanitized;
  }

  async function requestStaticTranslations(staticBase, language, sourceHash, entries) {
    const base = normalizeBaseUrl(staticBase);
    if (!base) return null;

    const staticVersion = `${sourceHash}-${STATIC_TRANSLATION_VERSION}`;
    const response = await fetch(`${base}${encodeURIComponent(language)}.json?v=${encodeURIComponent(staticVersion)}`, {
      cache: 'force-cache',
    });

    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Static translation request failed (${response.status})`);

    const data = await response.json();
    const translations = data && Array.isArray(data.translations) ? data.translations : null;
    if (!translations || data.language !== language) return null;

    if (data.sourceHash === sourceHash) return sanitizeStaticTranslations(translations);

    const bySource = new Map();
    translations.forEach((item) => {
      if (item && typeof item.source === 'string' && isUsableTranslationText(item.text)) {
        bySource.set(cleanText(item.source), item.text);
      }
    });

    const remapped = [];
    let matchedCount = 0;

    entries.forEach((entry) => {
      const translated = bySource.get(cleanText(entry.text));
      if (!translated) return;
      matchedCount += 1;
      remapped.push({ key: entry.key, text: translated });
    });

    const minimumUsefulCoverage = entries.length > 30 ? entries.length * 0.72 : entries.length;
    return matchedCount >= minimumUsefulCoverage ? remapped : null;
  }

  function estimatedPayloadChars(entry) {
    return Math.min(String(entry && entry.text ? entry.text : '').length, 700);
  }

  function createBatches(entries) {
    const batches = [];
    let current = [];
    let currentChars = 0;

    entries.forEach((entry) => {
      const chars = estimatedPayloadChars(entry);
      const shouldStartNewBatch = current.length > 0 && (
        current.length >= BATCH_MAX_ITEMS ||
        currentChars + chars > BATCH_MAX_CHARS
      );

      if (shouldStartNewBatch) {
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

  function create(options) {
    const settings = options || {};
    const root = settings.root || document;
    const select = settings.select || (root.getElementById && root.getElementById('languageSelect'));
    if (!select || select.dataset.floatingTranslatorReady === 'true') return null;

    select.dataset.floatingTranslatorReady = 'true';

    const textOriginals = new WeakMap();
    const attrOriginals = new WeakMap();
    const status = ensureStatus(select);
    let translationRunId = 0;
    let cachedEntries = null;
    let cacheDirty = true;

    function getEndpoint() {
      if (typeof settings.endpoint === 'function') return String(settings.endpoint() || '').trim();
      if (typeof settings.endpoint === 'string') return settings.endpoint.trim();
      return endpointFromPage(select);
    }

    function getStaticBase() {
      if (typeof settings.staticBase === 'function') return String(settings.staticBase() || '').trim();
      if (typeof settings.staticBase === 'string') return settings.staticBase.trim();
      return staticBaseFromPage(select);
    }

    function getPageUrl() {
      return typeof settings.pageUrl === 'function' ? settings.pageUrl() : pageUrlWithoutHash();
    }

    function closeNavigation() {
      if (typeof settings.onAfterChange === 'function') {
        settings.onAfterChange();
      }
      unlockPageScroll(root);
    }

    function markCacheDirty() {
      cacheDirty = true;
    }

    const observedRoot = root === document ? document.body : root;
    if (observedRoot && typeof MutationObserver === 'function') {
      const observer = new MutationObserver((mutations) => {
        const structuralChange = mutations.some((mutation) =>
          mutation.type === 'childList' &&
          Array.from(mutation.addedNodes || []).concat(Array.from(mutation.removedNodes || [])).some((node) => {
            if (!node || node.nodeType !== Node.ELEMENT_NODE) return false;
            return !shouldSkipElement(node);
          }),
        );
        if (structuralChange) markCacheDirty();
      });

      observer.observe(observedRoot, { childList: true, subtree: true });
    }

    function collectFresh() {
      const entries = [];
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          const parent = node.parentElement;
          if (!parent || shouldSkipElement(parent)) return NodeFilter.FILTER_REJECT;
          const original = textOriginals.get(node) || node.nodeValue || '';
          const parts = splitWhitespace(original);
          const normalized = cleanText(parts.text);
          if (!hasWords(normalized)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      });

      let textNode = walker.nextNode();
      while (textNode) {
        if (!textOriginals.has(textNode)) textOriginals.set(textNode, textNode.nodeValue || '');
        const node = textNode;
        const original = textOriginals.get(textNode);
        const parts = splitWhitespace(original);
        const text = cleanText(parts.text);

        entries.push({
          key: `t${entries.length}`,
          text,
          apply(value) {
            node.nodeValue = `${parts.before}${value || parts.text}${parts.after}`;
          },
          reset() {
            node.nodeValue = original;
          },
        });

        textNode = walker.nextNode();
      }

      root.querySelectorAll && root.querySelectorAll('*').forEach((element) => {
        if (shouldSkipElement(element)) return;

        TEXT_ATTRS.forEach((name) => {
          const value = element.getAttribute(name);
          if (!value) return;

          let originals = attrOriginals.get(element);
          if (!originals) {
            originals = {};
            attrOriginals.set(element, originals);
          }

          if (!Object.prototype.hasOwnProperty.call(originals, name)) {
            originals[name] = value;
          }

          const original = originals[name];
          if (!hasWords(original)) return;

          const text = cleanText(original);
          entries.push({
            key: `a${entries.length}`,
            text,
            apply(translated) {
              element.setAttribute(name, translated || original);
            },
            reset() {
              element.setAttribute(name, original);
            },
          });
        });
      });

      return entries;
    }

    function collect() {
      if (!cacheDirty && cachedEntries) return cachedEntries;
      cachedEntries = collectFresh();
      cacheDirty = false;
      return cachedEntries;
    }

    function reset() {
      collect().forEach((entry) => entry.reset());
      setDocumentLanguage(root, 'en');
      select.value = 'en';
      setStatus(status, 'English restored', 'ready');
      unlockPageScroll(root);
      window.setTimeout(() => setStatus(status, '', ''), 1800);
    }

    async function translate(language) {
      const runId = (translationRunId += 1);
      await deferWork();
      if (runId !== translationRunId) return;
      const entries = collect();
      const targetLabel = languageName(language);

      if (!entries.length) {
        setStatus(status, '', '');
        return;
      }

      setStatus(status, `Translating to ${targetLabel}`, 'loading');
      select.disabled = true;
      select.setAttribute('aria-busy', 'true');

      try {
        const sourceHash = hashString(entries.map((entry) => entry.text).join('\u001f'));
        const cacheKey = `${CACHE_VERSION}:${language}:${sourceHash}`;
        let translated = readCached(cacheKey);
        let shouldCacheTranslated = false;

        if (!translated) {
          try {
            translated = await requestStaticTranslations(getStaticBase(), language, sourceHash, entries);
            shouldCacheTranslated = Boolean(translated);
          } catch (error) {
            translated = null;
          }
        }

        if (!translated) {
          const endpoint = getEndpoint();
          if (!endpoint) {
            throw new Error('Translation endpoint is not configured');
          }

          translated = [];
          const batches = createBatches(entries);
          let nextBatchIndex = 0;
          let completedBatches = 0;
          let isActive = true;

          async function translateBatch(batch, batchIndex) {
            const responseItems = await requestTranslations(endpoint, {
              sourceLanguage: 'en',
              targetLanguage: language,
              targetLanguageName: targetLabel,
              pageUrl: getPageUrl(),
              items: batch.map((entry) => ({ key: entry.key, text: entry.text.slice(0, 700) })),
            });

            const normalizedItems = responseItems.map((item, index) => ({
              key: item && item.key !== undefined ? item.key : batch[index] && batch[index].key,
              text: item && typeof item.text === 'string' ? item.text : String(item || ''),
              batchIndex,
              itemIndex: index,
            }));

            if (!isActive || runId !== translationRunId) return normalizedItems;

            completedBatches += 1;

            if (batches.length > 1 && completedBatches < batches.length) {
              setStatus(status, `${targetLabel}: ${completedBatches}/${batches.length}`, 'loading');
            }

            return normalizedItems;
          }

          async function worker() {
            const workerResults = [];
            while (nextBatchIndex < batches.length) {
              const batchIndex = nextBatchIndex;
              nextBatchIndex += 1;
              const batchResults = await translateBatch(batches[batchIndex], batchIndex);
              workerResults.push(...batchResults);
            }
            return workerResults;
          }

          try {
            const workers = Array.from(
              { length: Math.min(MAX_PARALLEL_BATCHES, batches.length) },
              () => worker(),
            );
            const workerResults = await Promise.all(workers);
            translated = workerResults
              .flat()
              .sort((a, b) => (a.batchIndex - b.batchIndex) || (a.itemIndex - b.itemIndex));
          } catch (error) {
            isActive = false;
            throw error;
          }

          shouldCacheTranslated = true;
        }

        if (shouldCacheTranslated) writeCached(cacheKey, translated);

        if (runId !== translationRunId) return;

        const translatedMap = normalizeTranslations(translated);
        writeNextFrame(() => {
          if (runId !== translationRunId) return;
          entries.forEach((entry) => entry.apply(translatedMap.get(entry.key)));
          setDocumentLanguage(root, language);
          select.value = language;
          setStatus(status, `${targetLabel} on`, 'ready');
          unlockPageScroll(root);
        });
      } catch (error) {
        entries.forEach((entry) => entry.reset());
        setDocumentLanguage(root, 'en');
        select.value = 'en';
        setStatus(status, 'Translation is temporarily unavailable', 'fallback');
        window.setTimeout(() => setStatus(status, '', ''), 2600);
      } finally {
        if (runId === translationRunId) {
          select.disabled = false;
          select.removeAttribute('aria-busy');
          unlockPageScroll(root);
        }
      }
    }

    const selectedBeforeReady = select.value;

    select.addEventListener('change', () => {
      const language = select.value;
      if (!language) return;

      if (language === 'en') {
        closeNavigation();
        window.requestAnimationFrame(reset);
        return;
      }

      closeNavigation();
      translate(language);
    });

    select.disabled = false;
    select.removeAttribute('aria-busy');

    if (selectedBeforeReady && selectedBeforeReady !== 'en') {
      window.requestAnimationFrame(() => {
        closeNavigation();
        translate(selectedBeforeReady);
      });
    }

    return {
      reset,
      translate,
      collect,
    };
  }

  const api = {
    create,
  };

  function publish() {
    try {
      window.FloatingPageTranslator = api;
    } catch (error) {
      // Some embedded browsers lock the window object; the event path still works.
    }

    try {
      window.dispatchEvent(new CustomEvent('floatingtranslationready', { detail: api }));
    } catch (error) {
      // If CustomEvent is restricted, standard browsers still receive the global API.
    }
  }

  publish();
  window.setTimeout(publish, 0);
})();
