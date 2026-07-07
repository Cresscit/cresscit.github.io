# SEO PACKAGE — Build Spec
Goal: make the flagship maximally indexable and locally relevant WITHOUT touching the
cinematic experience or the perf scores (mobile ≥95, SEO 100 stay hard gates).
Copy for the new sections comes from content/copy.md ("## SERVICE AREA", "## FAQ",
updated "## SEO META") — verbatim as always.

## 1. Head plumbing (index.html)
- New title + meta description from the updated SEO META section.
- `<link rel="canonical" href="https://cresscit.github.io/">`.
- og:image: `<meta property="og:image" content="https://cresscit.github.io/assets/img/og.png">`
  (+ og:image:width 1200, og:image:height 630, `twitter:card` = summary_large_image).
  GENERATE the image: headless Chrome screenshot of the live-served hero at exactly
  1200×630 (chrome --headless=new --screenshot --window-size=1200,630 http://localhost:8321/
  — take it after a small delay so the poster/scene + title are visible; the CRESSCIT
  title must be legible in the capture). Save as assets/img/og.png. If the WebGL scene
  won't render in headless, the CSS poster + title is an acceptable capture.
- Keep existing OG title/desc unless copy.md changed them.

## 2. Structured data (three JSON-LD blocks, inline <script type="application/ld+json">)
a) ProfessionalService (LocalBusiness subtype):
   name Cresscit · url https://cresscit.github.io/ · email cresscit@gmail.com ·
   description from meta description · founder Person "inder" ·
   areaServed: City entries for Surrey, Vancouver, Abbotsford, Chilliwack, Mission
   (each with addressRegion BC, addressCountry CA) · priceRange from the honest framing
   (use "$$") · sameAs: [] for now (socials pending).
b) WebSite: name Cresscit, url.
c) FAQPage: one Question/acceptedAnswer per FAQ item — text MUST mirror the on-page FAQ
   copy exactly (Google requires parity). Answers as plain text (strip any markup).
NO invented data: no aggregateRating, no reviews, no telephone (none public yet), no
street address (none). Validate mentally against schema.org types.

## 3. New on-page sections (both crawlable static DOM, tokens for all values)
a) `@component: service-area` — between HOW IT WORKS and PRICING. Heading + body +
   microline from copy.md. Quiet band styling (ink-2, like pricing), cities may be
   subtly emphasized (cream vs cream-dim), reveal-on-scroll consistent with steps.
b) `@component: faq` — between PRICING and the FINALE. Section heading "FAQ" (display
   font, consistent with Work/steps headings). Native `<details>/<summary>` per item
   (crawlable, zero-JS, keyboard-accessible out of the box) styled to brand: hairline
   dividers, summary in body font 600 with an emerald +/− indicator (CSS only,
   details[open] state), answer text cream-dim, generous padding, 40px+ tap targets.
   All seven Q&As. No JS accordion logic — native behavior only.

## 4. Crawl files (repo root)
- robots.txt: allow all, `Sitemap: https://cresscit.github.io/sitemap.xml`.
- sitemap.xml: single URL entry https://cresscit.github.io/ with lastmod = build date.

## 5. Analytics stub (GoatCounter — awaiting founder's account code)
In index.html just before </body>, add a COMMENTED-OUT GoatCounter snippet:
`<!-- ANALYTICS (activate: replace CODE with the GoatCounter code and uncomment)
<script data-goatcounter="https://CODE.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script> -->`
Note: when activated this is the site's ONLY allowed external request. README gets an
"Analytics" bullet: create account at goatcounter.com (free), site code = cresscit,
uncomment + replace, plus a line for Google Search Console verification (HTML tag method
— leave a commented placeholder meta for it too: `<!-- <meta name="google-site-verification" content="PENDING"> -->`).

## 6. Guardrails
- Zero change to: hero/world, pillars, work, preview machine, quote form, existing copy.
- New sections must not break the world's scroll-station ranges noticeably: they sit in
  the CALM band (P .75–.88 stretches over more DOM height — verify the calm station
  still behaves; if station tuning is needed, adjust the P boundaries minimally and
  verify delivery/finale stations still align with their sections).
- Reduced-motion & no-WebGL: new sections fully readable (they're static anyway).
- Lighthouse after: SEO 100, mobile perf ≥95, a11y ≥95. Zero console errors.
- Update README placeholder table (og:image → done; analytics + GSC → pending founder).

## Definition of done (verify live on :8321 before handing back)
Both sections render and reveal correctly desktop + 375px; details/summary keyboard +
screen-reader sane; JSON-LD parses (JSON.parse each block) and FAQPage text matches DOM;
og.png exists, is 1200×630, title legible; robots/sitemap served with 200; canonical
present; Lighthouse (mobile) run with scores reported; world stations still aligned
(scroll-through check incl. finale). Screenshots: seo-faq.png, seo-servicearea.png,
plus the og.png itself, to qa-evidence\flagship\.
