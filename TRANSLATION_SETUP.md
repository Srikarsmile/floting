# Branded Translation Setup

The language selector now translates the page in-place through the Vercel function at `/api/translate`.

## Vercel Environment Variables

Set the OpenRouter key in Vercel, not in the repo:

```sh
npx vercel link
npx vercel env add OPENROUTER_API_KEY production --sensitive
npx vercel env add OPENROUTER_API_KEY preview --sensitive
```

Optional defaults:

```sh
npx vercel env add OPENROUTER_MODEL production
# value: ~google/gemini-flash-latest
```

## Wix Custom Element

Wix should load the stable Vercel loader in `wix-home-page-code.js`:

```js
const floatingLoaderUrl = "https://floting.vercel.app/wix-loader.js";
const floatingManifestUrl = "https://floting.vercel.app/build-manifest.json";
```

The loader reads `build-manifest.json`, then loads the current custom element runtime and asset versions from Vercel. For content updates, bump the manifest `version` and matching asset query strings in the repo, then push to GitHub. Wix does not need a page-code edit for each content build.

There is also a compatibility wrapper at `wix-floating-home.js`. If Wix is still configured to load the older GitHub Pages custom-element URL, that file now delegates to the same Vercel loader instead of carrying the full runtime. The real custom-element code lives in `wix-floating-home-runtime.js` and is selected by `build-manifest.json`.

If the Wix custom element is used outside the Vercel-hosted site, keep this endpoint in `wix-home-page-code.js`:

```js
const floatingTranslationEndpoint = "https://floting.vercel.app/api/translate";
```

The API key must only live in Vercel environment variables.
