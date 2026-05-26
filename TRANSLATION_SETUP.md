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

If the Wix custom element is used outside the Vercel-hosted site, set this in `wix-home-page-code.js`:

```js
const floatingTranslationEndpoint = "https://floting.vercel.app/api/translate";
```

The API key must only live in Vercel environment variables.
