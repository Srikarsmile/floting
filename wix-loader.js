(function () {
  'use strict';

  var DEFAULT_MANIFEST_URL = 'https://floting.vercel.app/build-manifest.json';
  var DEFAULT_ASSET_BASE = 'https://floting.vercel.app/';
  var DEFAULT_VERSION = '20260606-05';
  var LOADER_ID = 'floating-home-vercel-loader';
  var RUNTIME_ID = 'floating-home-runtime';
  var APPLY_DELAYS = [0, 40, 120, 300, 700, 1500, 3000, 6000];
  var VIEWPORT_CONTENT = 'width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover';
  var LEGACY_ROUTE_REDIRECTS = {
    counselling: '/therapy',
    'types-of-therapy': '/therapy#therapy-types',
    'online-telephone-session': '/therapy',
    community: '/#hub',
    holidayschool: '/#holiday-school',
    'holiday-school': '/#holiday-school',
    covid19: '/',
    events: '/',
    wch: '/#hub',
    homelessproject: '/#hub',
    international: '/#hub',
    freeresources: '/',
    counsellorgetpaid: '/',
    'blank-3': '/',
    newpage: '/',
  };
  var LEGACY_MENU_LABELS_TO_KEEP = {
    home: true,
    'book - disciplining with love': true,
    book: true,
    blog: true,
  };
  var LEGACY_MENU_LABELS_TO_HIDE = {
    'new page': true,
    community: true,
    'holiday school': true,
    '+ events': true,
    events: true,
    'counsellors get paid course': true,
    'free resources': true,
    'covid 19': true,
    'book a session': true,
  };
  var LEGACY_MENU_PATHS_TO_HIDE = {
    counselling: true,
    'online-telephone-session': true,
    community: true,
    holidayschool: true,
    covid19: true,
    events: true,
    wch: true,
    homelessproject: true,
    international: true,
    freeresources: true,
    counsellorgetpaid: true,
    'blank-3': true,
  };
  function normalizedCurrentPath() {
    try {
      return window.location.pathname.toLowerCase().replace(/^\/+|\/+$/g, '');
    } catch (error) {
      return '';
    }
  }

  function isEditorLike() {
    try {
      return /editor\.wix\.com|\/html\/editor\/|CustomElementPreviewIframe|editor-elements-library/i.test(
        String(window.location.href || '') + ' ' + String(document.referrer || ''),
      );
    } catch (error) {
      return false;
    }
  }

  function redirectLegacyRoute() {
    if (isEditorLike()) return false;

    var path = normalizedCurrentPath();
    var target = LEGACY_ROUTE_REDIRECTS[path];
    if (!target) return false;

    try {
      var url = new URL(target, window.location.origin);
      window.location.replace(url.toString());
      return true;
    } catch (error) {
      return false;
    }
  }

  function normalizeMenuLabel(value) {
    return String(value || '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function pathFromHref(anchor) {
    try {
      return new URL(anchor.getAttribute('href') || '', window.location.href)
        .pathname
        .toLowerCase()
        .replace(/^\/+|\/+$/g, '');
    } catch (error) {
      return '';
    }
  }

  function closestMenuItem(anchor) {
    return (
      anchor.closest('[data-testid="menuItemDepth0"]') ||
      anchor.closest('li') ||
      anchor
    );
  }

  function cleanLegacyWixNavigation() {
    if (isEditorLike()) return;

    Array.prototype.slice.call(document.querySelectorAll('a[href]')).forEach(function (anchor) {
      if (anchor.closest('floating-home')) return;

      var label = normalizeMenuLabel(anchor.textContent);
      var path = pathFromHref(anchor);
      var keep =
        LEGACY_MENU_LABELS_TO_KEEP[label] ||
        path === '' ||
        path === 'book' ||
        path === 'blog';
      var hide =
        LEGACY_MENU_LABELS_TO_HIDE[label] ||
        LEGACY_MENU_PATHS_TO_HIDE[path];

      if (path === 'book') {
        anchor.setAttribute('href', 'https://www.floatingcounselling.co.uk/book');
      }
      if (path === 'blog') {
        anchor.setAttribute('href', 'https://www.floatingcounselling.co.uk/blog');
      }
      if (path === '' && label === 'home') {
        anchor.setAttribute('href', 'https://www.floatingcounselling.co.uk/');
      }

      if (hide && !keep) {
        var item = closestMenuItem(anchor);
        item.setAttribute('data-floating-legacy-hidden', 'true');
        item.setAttribute('aria-hidden', 'true');
        item.style.setProperty('display', 'none', 'important');
        item.style.setProperty('visibility', 'hidden', 'important');
        item.style.setProperty('pointer-events', 'none', 'important');
      }
    });
  }

  function scheduleLegacyNavigationCleanup() {
    APPLY_DELAYS.forEach(function (delay) {
      window.setTimeout(cleanLegacyWixNavigation, delay);
    });

    if (typeof MutationObserver !== 'function' || !document.body) return;

    var observer = new MutationObserver(function () {
      cleanLegacyWixNavigation();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.setTimeout(function () {
      observer.disconnect();
    }, 8000);
  }

  function ensureViewportMeta() {
    if (!document.head) return;

    var viewport = document.head.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.setAttribute('name', 'viewport');
      document.head.appendChild(viewport);
    }

    viewport.setAttribute('content', VIEWPORT_CONTENT);
    viewport.setAttribute('data-floating-viewport', 'true');
  }

  function scheduleViewportUpdates() {
    APPLY_DELAYS.forEach(function (delay) {
      window.setTimeout(ensureViewportMeta, delay);
    });
  }

  function normalizeUrl(value, fallback) {
    try {
      return new URL(String(value || fallback), DEFAULT_ASSET_BASE).toString();
    } catch (error) {
      return fallback;
    }
  }

  function normalizeManifest(raw) {
    var manifest = raw && typeof raw === 'object' ? raw : {};
    var assetBase = normalizeUrl(manifest.assetBase, DEFAULT_ASSET_BASE);
    var version = String(manifest.version || DEFAULT_VERSION).trim() || DEFAULT_VERSION;
    var favicons = manifest.favicons && typeof manifest.favicons === 'object' ? manifest.favicons : {};
    var pages = manifest.pages && typeof manifest.pages === 'object' ? manifest.pages : {};

    return {
      version: version,
      assetBase: assetBase,
      runtime: normalizeUrl(manifest.runtime, assetBase + 'wix-floating-home-runtime.js?v=' + encodeURIComponent(version)),
      html: normalizeUrl(manifest.html, assetBase + 'index.html?v=' + encodeURIComponent(version)),
      styles: normalizeUrl(manifest.styles, assetBase + 'styles.css?v=' + encodeURIComponent(version)),
      translationScript: normalizeUrl(
        manifest.translationScript,
        assetBase + 'floating-translation.js?v=' + encodeURIComponent(version),
      ),
      translationEndpoint: normalizeUrl(manifest.translationEndpoint, assetBase + 'api/translate'),
      translationStaticBase: normalizeUrl(manifest.translationStaticBase, assetBase + 'translations/'),
      translationShadowStaticBase: normalizeUrl(
        manifest.translationShadowStaticBase,
        assetBase + 'translations/wix/',
      ),
      faviconSvg: normalizeUrl(favicons.svg, assetBase + 'images/favicon.svg?v=' + encodeURIComponent(version)),
      favicon32: normalizeUrl(favicons.png32, assetBase + 'images/favicon-32.png?v=' + encodeURIComponent(version)),
      favicon512: normalizeUrl(favicons.png512, assetBase + 'images/favicon-512.png?v=' + encodeURIComponent(version)),
      appleTouchIcon: normalizeUrl(favicons.appleTouchIcon, assetBase + 'images/favicon-180.png?v=' + encodeURIComponent(version)),
      pages: {
        home: {
          html: normalizeUrl(pages.home && pages.home.html, assetBase + 'index.html?v=' + encodeURIComponent(version)),
          url: 'https://www.floatingcounselling.co.uk/',
        },
        therapy: {
          html: normalizeUrl(pages.therapy && pages.therapy.html, assetBase + 'therapy.html?v=' + encodeURIComponent(version)),
          url: 'https://www.floatingcounselling.co.uk/therapy',
        },
        fundraiser: {
          html: normalizeUrl(
            pages.fundraiser && pages.fundraiser.html,
            assetBase + 'ways-to-fundraise.html?v=' + encodeURIComponent(version),
          ),
          url: 'https://www.floatingcounselling.co.uk/ways-to-fundraise',
        },
        book: {
          html: normalizeUrl(pages.book && pages.book.html, assetBase + 'book.html?v=' + encodeURIComponent(version)),
          url: 'https://www.floatingcounselling.co.uk/book',
        },
        blog: {
          html: normalizeUrl(pages.blog && pages.blog.html, assetBase + 'blog.html?v=' + encodeURIComponent(version)),
          url: 'https://www.floatingcounselling.co.uk/blog',
        },
      },
    };
  }

  function manifestUrl() {
    var currentScript = document.currentScript;
    var fromScript = currentScript && currentScript.getAttribute('data-manifest-url');
    return normalizeUrl(fromScript, DEFAULT_MANIFEST_URL);
  }

  function fetchManifest() {
    if (typeof fetch !== 'function') {
      return Promise.resolve(normalizeManifest({}));
    }

    return fetch(manifestUrl(), { cache: 'no-store', mode: 'cors' })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Manifest request failed');
        }
        return response.json();
      })
      .then(normalizeManifest)
      .catch(function () {
        return normalizeManifest({});
      });
  }

  function floatingHomes() {
    return Array.prototype.slice.call(document.querySelectorAll('floating-home'));
  }

  function pageKeyForPath() {
    try {
      var pathname = window.location.pathname.toLowerCase().replace(/\/+$/, '');
      if (/(^|\/)(therapy|counselling|types-of-therapy)(?:\.html)?$/.test(pathname)) return 'therapy';
      if (/(^|\/)(ways-to-fundraise|fundraiser)(?:\.html)?$/.test(pathname)) return 'fundraiser';
      if (/(^|\/)book(?:\.html)?$/.test(pathname)) return 'book';
      if (/(^|\/)blog(?:\.html)?$/.test(pathname)) return 'blog';
    } catch (error) {
      // Fall through to home.
    }

    return 'home';
  }

  function applyManifestToElements(manifest) {
    floatingHomes().forEach(function (element) {
      element.setAttribute('data-floating-build', manifest.version);
      element.setAttribute('data-floating-page', pageKeyForPath());
      element.setAttribute('data-floating-asset-base', manifest.assetBase);
      element.setAttribute('data-translation-endpoint', manifest.translationEndpoint);
      element.setAttribute('data-translation-static-base', manifest.translationStaticBase);
      element.setAttribute('data-translation-shadow-static-base', manifest.translationShadowStaticBase);
      element.setAttribute('data-floating-manifest-url', manifestUrl());
    });
  }

  function scheduleElementUpdates(manifest) {
    APPLY_DELAYS.forEach(function (delay) {
      window.setTimeout(function () {
        applyManifestToElements(manifest);
      }, delay);
    });
  }

  function appendIconLink(id, attributes) {
    var existing = document.getElementById(id);
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }

    var link = document.createElement('link');
    link.id = id;
    Object.keys(attributes).forEach(function (name) {
      link.setAttribute(name, attributes[name]);
    });
    link.setAttribute('data-floating-favicon', 'true');
    document.head.appendChild(link);
  }

  function applyFavicons(manifest) {
    if (!document.head) return;

    Array.prototype.slice
      .call(document.head.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"], link[rel="mask-icon"]'))
      .forEach(function (link) {
        if (link.getAttribute('data-floating-favicon') === 'true') return;
        if (link.parentNode) link.parentNode.removeChild(link);
      });

    appendIconLink('floating-favicon-svg', {
      rel: 'icon',
      type: 'image/svg+xml',
      href: manifest.faviconSvg,
    });
    appendIconLink('floating-favicon-32', {
      rel: 'icon',
      type: 'image/png',
      sizes: '32x32',
      href: manifest.favicon32,
    });
    appendIconLink('floating-favicon-512', {
      rel: 'icon',
      type: 'image/png',
      sizes: '512x512',
      href: manifest.favicon512,
    });
    appendIconLink('floating-apple-touch-icon', {
      rel: 'apple-touch-icon',
      sizes: '180x180',
      href: manifest.appleTouchIcon,
    });
  }

  function scheduleFaviconUpdates(manifest) {
    APPLY_DELAYS.forEach(function (delay) {
      window.setTimeout(function () {
        applyFavicons(manifest);
      }, delay);
    });
  }

  function loadRuntime(manifest) {
    var existing = document.getElementById(RUNTIME_ID);

    if (existing && existing.getAttribute('data-floating-version') === manifest.version) {
      return;
    }

    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }

    var script = document.createElement('script');
    script.id = RUNTIME_ID;
    script.src = manifest.runtime;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    script.setAttribute('data-floating-version', manifest.version);
    script.setAttribute('data-floating-runtime', 'true');

    document.head.appendChild(script);
  }

  function publishManifest(manifest) {
    window.FloatingHomeManifest = manifest;
    window.dispatchEvent(new CustomEvent('floatinghomemanifestready', { detail: manifest }));
  }

  function boot() {
    if (redirectLegacyRoute()) return;
    ensureViewportMeta();
    scheduleViewportUpdates();
    scheduleLegacyNavigationCleanup();

    fetchManifest().then(function (manifest) {
      publishManifest(manifest);
      scheduleFaviconUpdates(manifest);
      scheduleElementUpdates(manifest);
      loadRuntime(manifest);
    });
  }

  if (document.getElementById(LOADER_ID) && document.currentScript && document.currentScript.id !== LOADER_ID) {
    boot();
    return;
  }

  boot();
})();
