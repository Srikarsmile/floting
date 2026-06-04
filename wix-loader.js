(function () {
  'use strict';

  var DEFAULT_MANIFEST_URL = 'https://floting.vercel.app/build-manifest.json';
  var DEFAULT_ASSET_BASE = 'https://floting.vercel.app/';
  var DEFAULT_VERSION = '20260604-08';
  var LOADER_ID = 'floating-home-vercel-loader';
  var RUNTIME_ID = 'floating-home-runtime';
  var APPLY_DELAYS = [0, 40, 120, 300, 700, 1500, 3000, 6000];
  var VIEWPORT_CONTENT = 'width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover';

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
      if (/(^|\/)therapy(?:\.html)?$/.test(pathname)) return 'therapy';
      if (/(^|\/)(ways-to-fundraise|fundraiser)(?:\.html)?$/.test(pathname)) return 'fundraiser';
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
    ensureViewportMeta();
    scheduleViewportUpdates();

    fetchManifest().then(function (manifest) {
      publishManifest(manifest);
      scheduleElementUpdates(manifest);
      scheduleFaviconUpdates(manifest);
      loadRuntime(manifest);
    });
  }

  if (document.getElementById(LOADER_ID) && document.currentScript && document.currentScript.id !== LOADER_ID) {
    boot();
    return;
  }

  boot();
})();
