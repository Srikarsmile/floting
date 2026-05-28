(function () {
  'use strict';

  var LOADER_ID = 'floating-home-vercel-loader';
  var DEFAULT_LOADER_URL = 'https://floting.vercel.app/wix-loader.js';
  var DEFAULT_MANIFEST_URL = 'https://floting.vercel.app/build-manifest.json';

  function normalizeUrl(value, fallback) {
    try {
      return new URL(String(value || fallback), fallback).toString();
    } catch (error) {
      return fallback;
    }
  }

  function currentManifestUrl() {
    var script = document.currentScript;
    return normalizeUrl(script && script.getAttribute('data-manifest-url'), DEFAULT_MANIFEST_URL);
  }

  function loadVercelLoader() {
    var existing = document.getElementById(LOADER_ID);

    if (existing) {
      existing.setAttribute('data-manifest-url', currentManifestUrl());
      return;
    }

    var script = document.createElement('script');
    script.id = LOADER_ID;
    script.src = DEFAULT_LOADER_URL;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    script.setAttribute('data-manifest-url', currentManifestUrl());

    document.head.appendChild(script);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadVercelLoader, { once: true });
  } else {
    loadVercelLoader();
  }
})();
