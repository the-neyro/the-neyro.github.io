// Nextfix-Website: das bisschen Skript, das die Seite braucht.
// Ohne JavaScript bleibt alles lesbar; jede Funktion prüft, ob ihr Element existiert.

const ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Lesetexte: Absätze, Überschriften und Fragen einzeln einblenden
document.querySelectorAll('.prose > h2, .prose > p, .prose > ul > li, .prose > .code, .faq-list .qa, .steps > li > *').forEach((el) => {
  if (!el.closest('[data-reveal]')) el.setAttribute('data-reveal', '');
});

// Einblenden, sobald ein Element ins Bild kommt (einmalig)
(() => {
  const ziele = document.querySelectorAll('[data-reveal]');
  if (!ziele.length) return;
  if (!('IntersectionObserver' in window)) { ziele.forEach((el) => el.classList.add('is-in')); return; }
  const io = new IntersectionObserver((eintraege) => {
    for (const e of eintraege) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
  ziele.forEach((el) => io.observe(el));
  // Sicherheitsnetz: was nach dem Laden im Bild ist, wird sicher sichtbar
  window.addEventListener('load', () => setTimeout(() => {
    ziele.forEach((el) => { const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) el.classList.add('is-in'); });
  }, 2000));
})();

// Held: Filmstreifen mit vier echten Ansichten, wechselt alle paar Sekunden, Klick schaltet weiter
(() => {
  const reel = document.querySelector('[data-reel]');
  if (!reel) return;
  const items = [...reel.querySelectorAll('.reel__item')];
  const n = items.length;
  let aktuell = 0;
  let pause = false;
  let sichtbar = true;
  const setzen = () => {
    items.forEach((el, i) => {
      let pos = (i - aktuell + n) % n;      // 0 = Mitte, 1 = unten, n-1 = oben
      if (pos === n - 1) pos = -1;
      else if (pos > 1) pos = 2;
      el.dataset.pos = String(pos);
      el.setAttribute('aria-hidden', pos === 0 ? 'false' : 'true');
    });
  };
  const weiter = () => { aktuell = (aktuell + 1) % n; setzen(); };
  setzen();
  // Wer selbst klickt, bekommt keinen Automatik-Wechsel mehr (WCAG 2.2.2)
  let gestoppt = false;
  reel.addEventListener('click', () => { gestoppt = true; weiter(); });
  reel.addEventListener('pointerenter', () => { pause = true; });
  reel.addEventListener('pointerleave', () => { pause = false; });
  reel.addEventListener('focusin', () => { pause = true; });
  reel.addEventListener('focusout', () => { pause = false; });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { sichtbar = e.isIntersecting; }).observe(reel);
  }
  if (!ruhig) setInterval(() => { if (!gestoppt && !pause && sichtbar && !document.hidden) weiter(); }, 4200);
})();

// Seitentitel prüfen: Regeln aus „Seite optimieren“ (app/onpage/abgleich.py), hier im Browser gerechnet
const TITLE_MAX = 70;
const STOP = new Set(['der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'einer', 'und', 'oder',
  'in', 'im', 'am', 'an', 'auf', 'aus', 'bei', 'mit', 'von', 'vom', 'zu', 'zum', 'zur', 'fuer', 'ueber', 'nach', 'wie',
  'was', 'ist', 'sind', 'the', 'and', 'for', 'of', 'to']);
const AKRONYME = new Set(['ki', 'seo', 'sea', 'gmbh', 'ag', 'ug', 'pdf', 'csv', 'it']);

function norm(text) {
  let t = text.toLowerCase().replaceAll('ä', 'ae').replaceAll('ö', 'oe').replaceAll('ü', 'ue').replaceAll('ß', 'ss');
  return t.replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean).join(' ');
}
function kern(keyword) {
  const woerter = norm(keyword).split(' ').filter(Boolean);
  const k = woerter.filter((w) => !STOP.has(w));
  return k.length ? k : woerter;
}
function phraseIn(keyword, text) { return ` ${norm(text)} `.includes(` ${norm(keyword)} `); }
function woerterIn(keyword, text) {
  const tokens = norm(text).split(' ');
  return kern(keyword).every((w) => tokens.some((t) => t === w || (w.length >= 4 && t.startsWith(w))));
}
function gross(text) {
  const satz = text.trim().split(/\s+/).map((w) => (AKRONYME.has(w.toLowerCase()) ? w.toUpperCase() : w)).join(' ');
  return satz.charAt(0).toUpperCase() + satz.slice(1);
}
function stutzen(s) { return s.replace(/^[ :|]+|[ :|]+$/g, ''); }
function titleVorschlag(keyword, title) {
  const teile = (title || '').split(/\s[|–—-]\s/).map((t) => t.trim()).filter(Boolean);
  const marke = teile.length > 1 ? teile.reduce((a, b) => (b.length < a.length ? b : a)) : '';
  const rest = teile.find((t) => t !== marke) || '';
  const kw = gross(keyword);
  for (const k of [`${kw}: ${rest} | ${marke}`, `${kw}: ${rest}`, `${kw} | ${marke}`, kw]) {
    const kandidat = stutzen(k);
    if (kandidat.length <= TITLE_MAX) return kandidat;
  }
  return kw;
}
function pruefeTitle(title, keyword) {
  const n = [...title].length;
  let laenge;
  if (n === 0) laenge = '<strong>Fehlt.</strong> Ohne Seitentitel nimmt Google irgendeinen Text von der Seite.';
  else if (n <= 10) laenge = `<strong>Zu kurz:</strong> ${n} Zeichen. Sag, worum es auf der Seite geht.`;
  else if (n > TITLE_MAX) laenge = `<strong>Zu lang:</strong> ${n} von ${TITLE_MAX} Zeichen. Google schneidet das Ende ab, kürze um ${n - TITLE_MAX}.`;
  else laenge = `<strong>Passt:</strong> ${n} von ${TITLE_MAX} Zeichen.`;

  let begriff; let vorschlag = '';
  const kw = keyword.trim();
  if (!kw) begriff = 'Trag oben einen Suchbegriff ein.';
  else {
    const drin = phraseIn(kw, title) || woerterIn(kw, title);
    const nt = norm(title);
    const vorn = nt.indexOf(kern(kw)[0]) <= Math.floor(nt.length / 2);
    if (!drin) begriff = `<strong>Fehlt.</strong> Nimm „${esc(kw)}“ in den Seitentitel auf, möglichst weit vorn. Wirkung hoch.`;
    else if (!vorn) begriff = '<strong>Steht hinten.</strong> Zieh ihn an den Anfang, den Namen deiner Firma nach hinten.';
    else begriff = '<strong>Passt:</strong> steht drin, und zwar vorn.';
    if (!drin || !vorn) vorschlag = titleVorschlag(kw, title);
  }
  return { laenge, begriff, vorschlag };
}
function esc(s) { return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

(() => {
  const box = document.querySelector('[data-typer]');
  if (!box) return;
  const title = box.querySelector('#title-input');
  const keyword = box.querySelector('#keyword-input');
  const laenge = box.querySelector('[data-out="laenge"]');
  const begriff = box.querySelector('[data-out="begriff"]');
  const vorschlag = box.querySelector('[data-out="vorschlag"]');
  const kopieren = box.querySelector('[data-copy-vorschlag]');
  const eigen = box.querySelector('[data-own]');
  const beispiele = [...box.querySelectorAll('[data-example]')];
  let eigenerTitel = null;
  const linie = box.querySelector('.typer__line');
  // Feld wächst mit dem Text, statt ihn abzuschneiden; Zeilenumbrüche gibt es in Titeln nicht
  const hoehe = () => { title.style.height = 'auto'; title.style.height = `${title.scrollHeight}px`; };
  // Ändert sich das Urteil (z. B. „Fehlt.“ → „Passt:“), leuchtet die Zeile kurz auf; Tippen im selben Urteil bleibt ruhig
  const urteil = (el, html) => {
    const vorher = el.querySelector('strong')?.textContent;
    el.innerHTML = html;
    const nachher = el.querySelector('strong')?.textContent;
    if (vorher && vorher !== nachher && el.animate) {
      const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
      el.closest('.check').animate([{ backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--surface-2') }, {}], { duration: 700, easing: ease });
      if (!ruhig) el.querySelector('strong')?.animate([{ opacity: 0, transform: 'translateY(0.5em)' }, {}], { duration: 360, easing: ease });
    }
  };
  const zeigen = () => {
    const text = title.value.replace(/\s*\n\s*/g, ' ');
    const r = pruefeTitle(text, keyword.value);
    const n = [...text].length;
    linie.style.setProperty('--fill', Math.min(n / TITLE_MAX, 1).toFixed(3));
    linie.classList.toggle('is-over', n > TITLE_MAX);
    urteil(laenge, r.laenge);
    urteil(begriff, r.begriff);
    vorschlag.textContent = r.vorschlag || 'Kein Vorschlag nötig.';
    kopieren.hidden = !r.vorschlag;
    kopieren.textContent = 'Vorschlag kopieren';
    hoehe();
  };
  const istBeispiel = () => beispiele.some((b) => b.dataset.title === title.value && b.dataset.keyword === keyword.value);
  title.addEventListener('keydown', (e) => { if (e.key === 'Enter') e.preventDefault(); });
  title.addEventListener('input', zeigen);
  keyword.addEventListener('input', zeigen);
  window.addEventListener('resize', hoehe);
  beispiele.forEach((b) => b.addEventListener('click', () => {
    if (!istBeispiel()) { eigenerTitel = { t: title.value, k: keyword.value }; eigen.hidden = false; }
    title.value = b.dataset.title;
    keyword.value = b.dataset.keyword;
    zeigen();
  }));
  eigen.addEventListener('click', () => {
    if (!eigenerTitel) return;
    title.value = eigenerTitel.t;
    keyword.value = eigenerTitel.k;
    zeigen();
    title.focus();
  });
  kopieren.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(vorschlag.textContent); kopieren.textContent = 'Kopiert'; } catch { kopieren.textContent = 'Kopieren ging nicht'; }
  });
  zeigen();
})();

// 106 Prüfungen: ein Name nach dem anderen leuchtet auf
(() => {
  const satz = document.querySelector('[data-lit]');
  if (!satz) return;
  const namen = [...satz.querySelectorAll('.c')];
  let i = 0; let sichtbar = false; let pause = false;
  namen[0].classList.add('is-lit');
  if (ruhig || !('IntersectionObserver' in window)) return;
  new IntersectionObserver(([e]) => { sichtbar = e.isIntersecting; }).observe(satz);
  satz.addEventListener('pointerenter', () => { pause = true; });
  satz.addEventListener('pointerleave', () => { pause = false; });
  // Ein Durchlauf durch die Liste, dann bleibt es stehen
  const takt = setInterval(() => {
    if (!sichtbar || pause || document.hidden) return;
    namen[i].classList.remove('is-lit');
    i += 1;
    if (i >= namen.length) { clearInterval(takt); namen[0].classList.add('is-lit'); return; }
    namen[i].classList.add('is-lit');
  }, 2000);
})();

// Codeblöcke: Kopierknopf
document.querySelectorAll('.code').forEach((block) => {
  const knopf = block.querySelector('.code__copy');
  const code = block.querySelector('code');
  if (!knopf || !code) return;
  knopf.hidden = false;
  knopf.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(code.textContent.trim()); knopf.textContent = 'Kopiert'; } catch { knopf.textContent = 'Markieren und kopieren'; }
    setTimeout(() => { knopf.textContent = 'Kopieren'; }, 2000);
  });
});
