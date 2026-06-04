# Wix Dashboard Editing Guide

The published Wix site is rendered by the `floating-home` custom element, but future text, link and list edits should be made in Wix CMS, not by editing the old visual Home page sections.

## Current Wix State

- Wix Dashboard path: `Website Content` -> `CMS`
- Editable collections already exist:
  - `FloatingHomeContent` (`Import1`) for one-off copy, images and links
  - `FloatingHomeItems` (`Import2`) for repeated cards and lists
- Both collections were empty when checked on 2026-06-04, so the site is currently falling back to the static Vercel content.
- The old Home page canvas can still show legacy Wix text in the editor. Treat that canvas as the render container only; the editable content source is the CMS.

## Seed The Dashboard

Import these two files into Wix CMS:

1. Open `FloatingHomeContent`.
2. Click `More Actions` -> `Import items`.
3. Upload `/Users/srikarreddy/Downloads/floting/wix-cms/FloatingHomeContent.csv`.
4. Map fields by matching names: `key`, `value`, `image`, `alt`, `url`, `enabled`.
5. Finish the import and confirm the collection shows rows.
6. Repeat for `FloatingHomeItems` with `/Users/srikarreddy/Downloads/floting/wix-cms/FloatingHomeItems.csv`.
7. Map fields by matching names: `section`, `order`, `title`, `subtitle`, `tag`, `body`, `image`, `alt`, `url`, `ctaLabel`, `email`, `role`, `initials`, `enabled`.

If Codex is doing the upload through Chrome and file upload is blocked, enable Chrome extension file access:

1. Open `chrome://extensions`.
2. Open `Details` for the Codex extension.
3. Enable `Allow access to file URLs`.
4. Retry the Wix CMS import.

## What To Edit Later

Use `FloatingHomeContent` for:

- hero heading and intro
- section headings and paragraphs
- image overrides
- button/link URLs

Use `FloatingHomeItems` for:

- pathways
- services
- community model cards
- holiday school lists
- hub events and flyers
- testimonials
- team cards
- partners
- original page links
- Ask Floating prompts

Set `enabled` to `false` to hide a row without deleting it. Keep `section` and `key` values stable because the custom element reads those IDs.

## Home Page Rule

Do not rebuild the visible Home page in the Wix visual editor. Keep the Home page as a full-width custom-element container named `customElement1`, with the Velo page code from `wix-home-page-code.js`. Use CMS rows for content edits and the Vercel files for design/code changes.
