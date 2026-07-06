/* ==========================================================================
   CRESSCIT — Quote Form
   Dynamically imported by js/main.js on first [data-quote-trigger] click
   (zero bytes in the initial load). A short intake overlay; on submit the
   visitor's mail client opens with the answers pre-written, addressed to
   CONTACT_EMAIL (js/site-config.js). Clipboard fallback included.

   Mirrors the Preview Machine dialog contract, including both lessons:
   - keydown handler lives on `document` while open (Esc from <body> works);
   - overlay root reuses the .pm-overlay shell, inheriting the
     `.pm-overlay[hidden] { display:none !important }` guarantee.

   Safety: user input is read via .value only and never interpolated into
   HTML strings. Nothing is stored or sent anywhere except the visitor's own
   mailto handoff / clipboard.

   Copy: all strings verbatim from content/copy.md "## QUOTE FORM".
   Styles: css/main.css under "@component: quote-form" (reuses .pm- shell).
   ========================================================================== */

import { CONTACT_EMAIL } from './site-config.js';

/* ---- Copy (verbatim) ----------------------------------------------------- */
const COPY = {
  headline: "Let's price your site.",
  subline: "A few quick questions — we'll come back with one flat price.",
  nameLabel: 'Your business name',
  namePlaceholder: 'e.g. Ember & Oak',
  pickerLabel: 'What do you do?',
  websiteLabel: 'Do you have a website today?',
  websiteOptions: ['Yes, but it needs work', 'No, starting fresh'],
  needsLabel: 'What do you need?',
  needsOptions: [
    'A brand-new website',
    'A redesign of my current site',
    'Online booking or reservations',
    'A menu, services, or price list',
    'Contact or quote forms',
    'An online store',
    "Not sure yet — that's fine",
  ],
  notesLabel: 'Anything else we should know?',
  notesPlaceholder: 'Deadlines, sites you like, budget worries — anything helps. Optional.',
  submit: 'Send My Request',
  helper: "This opens your email app with everything pre-written — hit send and we'll reply with one flat quote.",
  copyButton: 'No email app? Copy instead',
  copiedToast: 'Copied — ready to paste.',
  closeLabel: 'Close quote form',
  subjectTemplate: 'Website quote request — {{NAME}}',
};

/* Same four verticals as the Preview Machine (per copy.md). */
const VERTICAL_LABELS = ['Restaurant', 'Trades & Contracting', 'Clinic', 'Something Else'];

const NOT_ANSWERED = '(not answered)';
const NOT_SURE_INDEX = 6;   // "Not sure yet — that's fine" — mutually exclusive

/* ---- Tiny DOM helper (no innerHTML anywhere near user input) -------------- */
function el(tag, className, text) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text !== undefined) n.textContent = text;
  return n;
}

/* ---- Module state ---------------------------------------------------------- */
let overlay = null;
let refs = {};
let opts = {};
let openerEl = null;
let isOpen = false;
let keyHandler = null;

/* ==========================================================================
   Overlay construction (once; reused across opens)
   ========================================================================== */
function chipInput(type, name, value, labelText) {
  const chip = el('label', 'pm-chip');
  const input = el('input');
  input.type = type;
  input.name = name;
  input.value = value;
  input.className = 'pm-chip__radio';   // shared chip-input styling
  chip.append(input, el('span', 'pm-chip__text', labelText));
  return { chip, input };
}

function buildOverlay() {
  overlay = el('div', 'pm-overlay qf-overlay');   // inherits [hidden] guarantee
  overlay.hidden = true;

  const backdrop = el('div', 'pm-backdrop');
  backdrop.addEventListener('click', close);

  const panel = el('div', 'pm-panel');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-labelledby', 'qf-headline');

  const closeBtn = el('button', 'pm-close');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', COPY.closeLabel);
  closeBtn.append(el('span', 'pm-close__x', '×'));
  closeBtn.addEventListener('click', close);

  const headline = el('h2', 'pm-headline', COPY.headline);
  headline.id = 'qf-headline';
  const subline = el('p', 'pm-subline', COPY.subline);

  const form = el('form', 'pm-form qf-form');
  form.noValidate = true;

  /* Business name */
  const nameLabel = el('label', 'pm-label', COPY.nameLabel);
  nameLabel.htmlFor = 'qf-name';
  const nameInput = el('input', 'pm-input');
  nameInput.id = 'qf-name';
  nameInput.type = 'text';
  nameInput.name = 'qf-business-name';
  nameInput.placeholder = COPY.namePlaceholder;
  nameInput.maxLength = 60;
  nameInput.autocomplete = 'organization';

  /* Vertical (radio chips; nothing pre-checked — nothing is required) */
  const vertSet = el('fieldset', 'pm-verticals');
  vertSet.append(el('legend', 'pm-label', COPY.pickerLabel));
  const vertRow = el('div', 'pm-chiprow');
  VERTICAL_LABELS.forEach((label) => {
    vertRow.append(chipInput('radio', 'qf-vertical', label, label).chip);
  });
  vertSet.append(vertRow);

  /* Has-website (radio chips) */
  const webSet = el('fieldset', 'pm-verticals');
  webSet.append(el('legend', 'pm-label', COPY.websiteLabel));
  const webRow = el('div', 'pm-chiprow');
  COPY.websiteOptions.forEach((label) => {
    webRow.append(chipInput('radio', 'qf-haswebsite', label, label).chip);
  });
  webSet.append(webRow);

  /* Needs (checkbox chips with "not sure yet" mutual exclusion) */
  const needsSet = el('fieldset', 'pm-verticals');
  needsSet.append(el('legend', 'pm-label', COPY.needsLabel));
  const needsRow = el('div', 'pm-chiprow');
  const needsInputs = [];
  COPY.needsOptions.forEach((label, i) => {
    const { chip, input } = chipInput('checkbox', 'qf-needs', label, label);
    input.addEventListener('change', () => {
      if (!input.checked) return;
      if (i === NOT_SURE_INDEX) {
        needsInputs.forEach((other, j) => { if (j !== NOT_SURE_INDEX) other.checked = false; });
      } else {
        needsInputs[NOT_SURE_INDEX].checked = false;
      }
    });
    needsInputs.push(input);
    needsRow.append(chip);
  });
  needsSet.append(needsRow);

  /* Notes */
  const notesLabel = el('label', 'pm-label', COPY.notesLabel);
  notesLabel.htmlFor = 'qf-notes';
  const notes = el('textarea', 'pm-input qf-notes');
  notes.id = 'qf-notes';
  notes.name = 'qf-notes';
  notes.rows = 3;
  notes.placeholder = COPY.notesPlaceholder;

  /* Submit + helper + clipboard fallback */
  const submitBtn = el('button', 'btn btn--primary qf-submit', COPY.submit);
  submitBtn.type = 'submit';
  const helper = el('p', 'qf-helper', COPY.helper);
  helper.setAttribute('aria-live', 'polite');
  const copyBtn = el('button', 'pm-try qf-copybtn', COPY.copyButton);
  copyBtn.type = 'button';
  const toast = el('p', 'qf-toast');
  toast.setAttribute('aria-live', 'polite');
  const manualBox = el('textarea', 'pm-input qf-manual');
  manualBox.rows = 6;
  manualBox.readOnly = true;
  manualBox.hidden = true;
  manualBox.setAttribute('aria-label', COPY.copyButton);

  form.append(
    nameLabel, nameInput,
    vertSet, webSet, needsSet,
    notesLabel, notes,
    submitBtn, helper, copyBtn, toast, manualBox
  );
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitQuote();
  });
  copyBtn.addEventListener('click', copyQuote);

  panel.append(closeBtn, headline, subline, form);
  overlay.append(backdrop, panel);

  /* Keyboard: attached to document while open — an overlay-scoped listener
     misses Esc/Tab when focus sits on <body>. */
  keyHandler = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;
    const focusables = [...panel.querySelectorAll(
      'button, [href], input, select, textarea'
    )].filter((n) => !n.disabled && n.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  };

  document.body.append(overlay);
  refs = { panel, nameInput, helper, toast, manualBox };
}

/* ==========================================================================
   Answers → plain-text email
   ========================================================================== */
function readAnswers() {
  const name = refs.nameInput.value.trim();
  const vertical = overlay.querySelector('input[name="qf-vertical"]:checked');
  const hasSite = overlay.querySelector('input[name="qf-haswebsite"]:checked');
  const needs = [...overlay.querySelectorAll('input[name="qf-needs"]:checked')]
    .map((n) => n.value);
  const notes = overlay.querySelector('#qf-notes').value.trim();
  return { name, vertical: vertical ? vertical.value : '', hasSite: hasSite ? hasSite.value : '', needs, notes };
}

function compileEmail() {
  const a = readAnswers();
  const subject = a.name
    ? COPY.subjectTemplate.replace('{{NAME}}', a.name)
    : COPY.subjectTemplate.replace(' — {{NAME}}', '');   // no name segment
  const lines = [
    `Business: ${a.name || NOT_ANSWERED}`,
    `What they do: ${a.vertical || NOT_ANSWERED}`,
    `Has a site today: ${a.hasSite || NOT_ANSWERED}`,
    `Needs: ${a.needs.length ? a.needs.join(', ') : NOT_ANSWERED}`,
    `Notes: ${a.notes || NOT_ANSWERED}`,
    '',
    "— sent from cresscit's quote form",
  ];
  return { subject, body: lines.join('\r\n') };
}

/* ==========================================================================
   Submit / clipboard
   ========================================================================== */
function submitQuote() {
  const { subject, body } = compileEmail();
  const href =
    `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  // Temporary anchor click keeps page state (vs location.href navigation).
  const a = document.createElement('a');
  a.href = href;
  a.rel = 'noopener';
  document.body.append(a);
  a.click();
  a.remove();

  // Emphasize the helper (and re-announce it politely). Overlay stays open —
  // the mail app opens over it; auto-closing would lose the visitor's context.
  refs.helper.classList.add('qf-helper--sent');
  refs.helper.textContent = '';
  setTimeout(() => { refs.helper.textContent = COPY.helper; }, 40);
}

function copyQuote() {
  const { subject, body } = compileEmail();
  const text = `To: ${CONTACT_EMAIL}\r\nSubject: ${subject}\r\n\r\n${body}`;
  const done = () => { refs.toast.textContent = COPY.copiedToast; };
  const fallback = () => {
    refs.manualBox.hidden = false;
    refs.manualBox.value = text;
    refs.manualBox.focus();
    refs.manualBox.select();
  };
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else {
      fallback();
    }
  } catch (e) {
    fallback();
  }
}

/* ==========================================================================
   Open / close
   ========================================================================== */
export function openQuoteForm(options = {}) {
  opts = options;
  if (!overlay) buildOverlay();
  if (isOpen) return;
  isOpen = true;

  openerEl = options.trigger || document.activeElement;
  refs.toast.textContent = '';
  refs.manualBox.hidden = true;
  refs.helper.classList.remove('qf-helper--sent');
  refs.helper.textContent = COPY.helper;
  overlay.hidden = false;
  document.addEventListener('keydown', keyHandler);
  document.documentElement.classList.add('pm-lock');
  if (typeof opts.lockScroll === 'function') opts.lockScroll();
  refs.nameInput.focus();
}

function close() {
  if (!isOpen) return;
  isOpen = false;
  overlay.hidden = true;
  document.removeEventListener('keydown', keyHandler);
  document.documentElement.classList.remove('pm-lock');
  if (typeof opts.unlockScroll === 'function') opts.unlockScroll();
  if (openerEl && typeof openerEl.focus === 'function') openerEl.focus();
}
