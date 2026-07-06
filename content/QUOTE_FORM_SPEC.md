# QUOTE FORM — Build Spec (addendum; sibling of PREVIEW_MACHINE_SPEC.md)
"Request a Quote" opens a short intake overlay; on submit the visitor's mail client opens
with the answers pre-written, addressed to Cresscit. Copy from `content/copy.md`
"## QUOTE FORM" — verbatim.

## Contact address centralization (do this first)
Create `js/site-config.js` exporting `export const CONTACT_EMAIL = 'cresscit@gmail.com';`
— imported by BOTH lazy modules (preview-machine.js MAILTO_ADDR switches to it too).
Replace every static `hello@cresscit.com` in `index.html` no-JS fallback hrefs with the
real address. README placeholder table: email row now says "live Gmail — swap to branded
inbox later". One edit swaps it site-wide from then on.

## Architecture (mirror the Preview Machine exactly)
- New module `js/quote-form.js`, dynamically imported on first click of a
  `data-quote-trigger` element. Styles in `css/main.css` under
  `<!-- @component: quote-form -->`, reusing the `.pm-` overlay/backdrop/panel/close
  primitives where sensible (shared classes or thin `qf-` extensions — builder's call,
  no duplication of the dialog shell rules).
- Triggers: the pricing section "Request a Quote" button AND the finale secondary
  "Get a Quote" (its `#pricing` href stays as no-JS fallback; pricing button keeps a
  mailto fallback href to CONTACT_EMAIL). `preventDefault()` when JS is live.
- Same dialog a11y contract as the Preview Machine (and same two lessons learned):
  `role=dialog aria-modal`, focus into first field on open, trapped Tab cycle,
  **document-level** keydown while open (Esc from body must work), backdrop + X close,
  focus restore, scroll lock, `.pm-overlay[hidden]`-equivalent display:none guarantee.
- User input: textContent / value reads only — never into HTML strings. Nothing stored,
  nothing sent anywhere except the visitor's own mailto/clipboard.

## The form (single screen, scrolls inside panel if needed)
Fields per copy.md: business name (text) · vertical (4 radio chips, reuse Preview Machine
chip styling) · has-website (2 radio chips) · needs (7 checkboxes, styled as multi-select
chips, "not sure yet" clears the others when checked and vice versa) · notes (textarea,
3 rows). NOTHING is required — empty fields render as "(not answered)" in the email body.
Submit button + helper line under it, clipboard-fallback link-button below that.

## Submit behavior
1. Compile a plain-text body, one line per answer:
   Business: … / What they do: … / Has a site today: … / Needs: comma-list … /
   Notes: … / trailing line "— sent from cresscit's quote form".
2. Subject from copy.md template with the business name (fallback if empty: no name
   segment). `mailto:CONTACT_EMAIL?subject=…&body=…` — both `encodeURIComponent`ed;
   join body lines with `%0D%0A` (encode from a `\r\n`-joined string).
3. Open via a temporary anchor click (not location.href — keeps the page state).
   After triggering, show the helper line emphasized (aria-live polite) — do NOT close
   the overlay automatically (their mail app opens over it; closing loses context).
4. Clipboard fallback button: copies `To: CONTACT_EMAIL` + subject + the body text via
   navigator.clipboard.writeText, try/catch → on failure select-able <textarea> reveal.
   Success shows the toast text from copy.md (aria-live).

## Definition of done (verify live before handing to QA)
Both triggers open it; all fields keyboard-operable; "not sure yet" mutual-exclusion
works; submit opens a correctly encoded mailto (inspect the href: subject has the name,
body lines separated, no raw spaces/ampersands); empty-form submit produces valid
"(not answered)" body; clipboard fallback copies the full text; Esc/backdrop/X/focus
restore/scroll-lock all correct incl. Esc from body focus; 375×812 usable with internal
scroll; reduced-motion fine (form has minimal animation anyway); zero console errors;
initial-load network unchanged (module fetched only on trigger click); Preview Machine
still fully works (shared CSS untouched in behavior). Update README (quote flow + email
note). Screenshots: qf-form.png (filled), qf-sent.png (post-submit state), qf-mobile.png.
