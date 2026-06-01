(function () {
  'use strict';

  var DEFAULT_MANIFEST_URL = 'https://floting.vercel.app/build-manifest.json';
  var DEFAULT_ASSET_BASE = 'https://floting.vercel.app/';
  var DEFAULT_VERSION = '20260602-10';
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

  function applyManifestToElements(manifest) {
    floatingHomes().forEach(function (element) {
      element.setAttribute('data-floating-build', manifest.version);
      element.setAttribute('data-floating-asset-base', manifest.assetBase);
      element.setAttribute('data-translation-endpoint', manifest.translationEndpoint);
      element.setAttribute('data-translation-static-base', manifest.translationStaticBase);
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
      loadRuntime(manifest);
    });
  }

  if (document.getElementById(LOADER_ID) && document.currentScript && document.currentScript.id !== LOADER_ID) {
    boot();
    return;
  }

  boot();
})();
