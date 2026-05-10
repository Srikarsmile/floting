# Floating Home Wix CMS Setup

The custom element reads two Wix Content Manager collections. If the collections are empty or missing, the page keeps using the static fallback in `index.html`.

## Collection 1: `FloatingHomeContent`

Wix display name: `FloatingHomeContent`
Wix collection ID used in page code: `Import1`

Use this for one-off text, image and link overrides.

Fields:

- `key` - Text, unique key such as `hero.title`
- `value` - Text or Rich Text, main text value
- `image` - Image or URL, optional
- `alt` - Text, optional image alt text
- `url` - URL, optional link target
- `enabled` - Boolean

Import seed: `FloatingHomeContent.csv`

## Collection 2: `FloatingHomeItems`

Wix display name: `FloatingHomeItems`
Wix collection ID used in page code: `Import2`

Use this for repeated sections: pathways, services, community model cards, testimonials, team, partners, holiday weeks, hub flyers, assistant prompts, and original page links.

Fields:

- `section` - Text. Supported values: `pathways`, `services`, `communityModel`, `holidayValues`, `holidaySupport`, `holidayWeeks`, `hubEvents`, `hubFlyers`, `testimonials`, `team`, `partners`, `originalPages`, `assistantPrompts`
- `order` - Number
- `title` - Text
- `subtitle` - Text
- `tag` - Text
- `body` - Long Text
- `image` - Image or URL
- `alt` - Text
- `url` - URL
- `ctaLabel` - Text
- `email` - Text
- `role` - Text
- `initials` - Text
- `enabled` - Boolean

Import seed: `FloatingHomeItems.csv`

## Editing Workflow

1. Open Wix Content Manager.
2. Use the Wix collection IDs above in `wix-home-page-code.js`. Wix may keep generated IDs such as `Import1` and `Import2` even after you rename the display names.
3. Add the fields above.
4. Import the CSV seed files.
5. Edit rows in Wix CMS. Save the site, then use Test Site.

Images can be GitHub Pages image URLs, public image URLs, or Wix Media Manager image fields. The custom element normalises Wix image values such as `wix:image://...` into public `static.wixstatic.com` URLs.
