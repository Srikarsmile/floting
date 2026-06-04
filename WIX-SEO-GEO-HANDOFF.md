# Wix SEO/GEO Handoff

## What has been added in code

- Home page SEO title, meta description, robots directive, Open Graph and Twitter share tags.
- JSON-LD structured data for Floating Counselling as an NGO, the homepage, services, locations and FAQs.
- Therapy page SEO metadata, Service schema, Breadcrumb schema and visible FAQ content.
- Fundraiser page SEO metadata, DonateAction, HowTo, Breadcrumb and FAQ schema.
- Runtime SEO injection so the Wix custom-element page writes key metadata and JSON-LD into the Wix page head when the Vercel embed loads.
- `robots.txt`, `sitemap.xml` and `llms.txt` for the Vercel-hosted pages.

## Important current routing note

`https://www.floatingcounselling.co.uk/` is the live Wix home page.

The subpages currently resolve on Vercel:

- `https://floting.vercel.app/therapy.html`
- `https://floting.vercel.app/ways-to-fundraise.html`

As of 4 June 2026, the matching Wix-domain paths returned a Wix `400` response:

- `https://www.floatingcounselling.co.uk/therapy.html`
- `https://www.floatingcounselling.co.uk/ways-to-fundraise.html`

Until Wix pages or redirects are created for those paths, keep the subpage canonical URLs on Vercel.

## Wix dashboard steps still needed

1. Go to Wix Dashboard -> SEO & GEO.
2. Run the SEO setup checklist.
3. Set the Home page title:
   `Floating Counselling | Counselling, Therapy & Community Support in Croydon`
4. Set the Home page meta description:
   `Affordable counselling, family therapy, parenting support, food bank, financial literacy and community hub services across Croydon, Redbridge, Newham, Durham and Southwark.`
5. Confirm the Home page is indexable.
6. Connect or verify Google Search Console from the Wix SEO & GEO dashboard.
7. Submit the Wix-generated sitemap for `https://www.floatingcounselling.co.uk/`.
8. If Wix pages are later created for Therapy and Fundraiser, update their canonical URLs from Vercel to the Wix-domain URLs.

## GEO content guidance

GEO means making the site easy for AI search systems to understand and cite. Keep content direct, factual and source-like:

- Use clear question-and-answer FAQ blocks.
- Keep service names consistent: counselling, therapy, parenting support, community hub, food bank, financial literacy, employment support, holiday school.
- Mention exact service areas naturally: Croydon, Redbridge, Newham, Durham and Southwark.
- Keep contact details, addresses and programme descriptions consistent across Wix CMS, page copy and social profiles.
- Add updates through real service pages or blog posts rather than stuffing keywords into one page.
