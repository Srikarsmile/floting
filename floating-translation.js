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

  const BATCH_SIZE = 70;
  const CACHE_VERSION = 'floating-translation-v1';
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
    'select',
    'option',
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

  function externalTranslateUrl(language, pageUrl) {
    const url = new URL('https://translate.yandex.com/translate');
    url.searchParams.set('view', 'compact');
    url.searchParams.set('url', pageUrl);
    url.searchParams.set('lang', `en-${language}`);
    return url.toString();
  }

  function openExternalTranslation(language, pageUrl) {
    const url = externalTranslateUrl(language, pageUrl);
    if (typeof window.open === 'function') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    const link = document.createElement('a');
    link.href = url;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function pageUrlWithoutHash() {
    const url = new URL(window.location.href);
    url.hash = '';
    return url.toString();
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
    if (root && root.host && root.host.setAttribute) {
      root.host.setAttribute('lang', language);
      return;
    }

    document.documentElement.lang = language;
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
        map.set(String(index), item);
        return;
      }

      if (item && item.key !== undefined && typeof item.text === 'string') {
        map.set(String(item.key), item.text);
      }
    });
    return map;
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

    function getEndpoint() {
      if (typeof settings.endpoint === 'function') return String(settings.endpoint() || '').trim();
      if (typeof settings.endpoint === 'string') return settings.endpoint.trim();
      return endpointFromPage(select);
    }

    function getPageUrl() {
      return typeof settings.pageUrl === 'function' ? settings.pageUrl() : pageUrlWithoutHash();
    }

    function closeNavigation() {
      if (typeof settings.onAfterChange === 'function') {
        settings.onAfterChange();
      }
    }

    function collect() {
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

    function reset() {
      collect().forEach((entry) => entry.reset());
      setDocumentLanguage(root, 'en');
      select.value = 'en';
      setStatus(status, 'English restored', 'ready');
      window.setTimeout(() => setStatus(status, '', ''), 1800);
    }

    async function translate(language) {
      const endpoint = getEndpoint();
      const entries = collect();
      const targetLabel = languageName(language);

      if (!entries.length) {
        setStatus(status, '', '');
        return;
      }

      if (!endpoint) {
        setStatus(status, 'Opening translator', 'fallback');
        openExternalTranslation(language, getPageUrl());
        window.setTimeout(() => setStatus(status, '', ''), 2200);
        return;
      }

      setStatus(status, `Translating to ${targetLabel}`, 'loading');
      select.disabled = true;
      select.setAttribute('aria-busy', 'true');

      try {
        const sourceHash = hashString(entries.map((entry) => entry.text).join('\u001f'));
        const cacheKey = `${CACHE_VERSION}:${language}:${sourceHash}`;
        let translated = readCached(cacheKey);

        if (!translated) {
          translated = [];
          for (let start = 0; start < entries.length; start += BATCH_SIZE) {
            const batch = entries.slice(start, start + BATCH_SIZE);
            const responseItems = await requestTranslations(endpoint, {
              sourceLanguage: 'en',
              targetLanguage: language,
              targetLanguageName: targetLabel,
              pageUrl: getPageUrl(),
              items: batch.map((entry) => ({ key: entry.key, text: entry.text })),
            });
            translated = translated.concat(responseItems);
          }
          writeCached(cacheKey, translated);
        }

        const translatedMap = normalizeTranslations(translated);
        entries.forEach((entry) => entry.apply(translatedMap.get(entry.key)));
        setDocumentLanguage(root, language);
        select.value = language;
        setStatus(status, `${targetLabel} on`, 'ready');
      } catch (error) {
        setStatus(status, 'Opening backup translator', 'fallback');
        openExternalTranslation(language, getPageUrl());
        window.setTimeout(() => setStatus(status, '', ''), 2200);
      } finally {
        select.disabled = false;
        select.removeAttribute('aria-busy');
      }
    }

    select.addEventListener('change', () => {
      const language = select.value;
      if (!language) return;

      if (language === 'en') {
        reset();
        closeNavigation();
        return;
      }

      translate(language);
      closeNavigation();
    });

    return {
      reset,
      translate,
      collect,
    };
  }

  const api = {
    create,
    externalTranslateUrl,
    openExternalTranslation,
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
