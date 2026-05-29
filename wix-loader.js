(function () {
  'use strict';

  var DEFAULT_MANIFEST_URL = 'https://floting.vercel.app/build-manifest.json';
  var DEFAULT_ASSET_BASE = 'https://floting.vercel.app/';
  var DEFAULT_VERSION = '20260529-07';
  var LOADER_ID = 'floating-home-vercel-loader';
  var RUNTIME_ID = 'floating-home-runtime';
  var APPLY_DELAYS = [0, 40, 120, 300, 700, 1500, 3000, 6000];

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
