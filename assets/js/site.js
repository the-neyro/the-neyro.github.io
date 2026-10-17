// Nextfix-Website: das bisschen Skript, das die Seite braucht.
// Ohne JavaScript bleibt alles lesbar; jede Funktion prüft, ob ihr Element existiert.

window.nextfixOk = true; // Gegenstück zum Sicherheitsnetz im <head>
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

// Held: „Was jetzt tun“-Panel. Oberste Aufgabe wird an Ort und Stelle abgehakt und durchgestrichen,
// dann rücken die anderen nach; am Ende steht „Erneut prüfen“. Konzept: .review/hero-modul.md.
// Ohne JavaScript und bei reduzierter Bewegung bleibt das Standbild aus dem HTML stehen (1 erledigt, 2 aktiv).
(() => {
  const fig = document.querySelector('[data-wjt]');
  if (!fig) return;
  const liste = fig.querySelector('.wjt__list');
  const knopf = fig.querySelector('.wjt__toggle');
  const zaehler = fig.querySelector('.wjt__done');
  const vorlagen = [...liste.children].map((li) => li.cloneNode(true));
  const ICON_PAUSE = '<svg viewBox="0 0 12 12" aria-hidden="true"><rect x="2" y="1.5" width="2.6" height="9" fill="currentColor"/><rect x="7.4" y="1.5" width="2.6" height="9" fill="currentColor"/></svg>';
  const ICON_PLAY = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.5v9l7.5-4.5z" fill="currentColor"/></svg>';
  const warte = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const istSchluss = (r) => r.classList.contains('row--recheck');
  let rows = [];
  let erledigt = 0;
  let laeuft = !ruhig;
  let beschaeftigt = false;
  let schwebt = false;
  let fokus = false;
  let sichtbar = true;

  const slot = (el, s) => {
    el.dataset.slot = String(s);
    el.style.setProperty('--slot', s);
    const versteckt = s > 2;
    el.toggleAttribute('inert', versteckt);
    el.setAttribute('aria-hidden', String(versteckt));
  };
  // Alle Zeilen so hoch wie die höchste: nie halbe Zeilen, nichts springt
  const messen = () => {
    let h = 0;
    rows.forEach((r) => { r.style.minHeight = 'auto'; h = Math.max(h, r.offsetHeight); r.style.minHeight = ''; });
    if (h) liste.style.setProperty('--row-h', `${h}px`);
  };
  const zaehlen = () => { zaehler.textContent = `${erledigt} von 4 erledigt`; };
  const aktiv = (index = 0) => rows.forEach((r, i) => r.classList.toggle('is-active', i === index && !r.classList.contains('is-done') && !istSchluss(r)));
  const knopfZeigen = () => {
    if (ruhig) { knopf.textContent = 'Nächste abhaken'; knopf.removeAttribute('aria-pressed'); return; }
    knopf.innerHTML = laeuft ? `${ICON_PAUSE}Anhalten` : `${ICON_PLAY}Abspielen`;
    knopf.setAttribute('aria-pressed', String(!laeuft));
  };
  const neuAufbauen = () => {
    liste.replaceChildren(...vorlagen.map((v) => v.cloneNode(true)));
    rows = [...liste.children];
    rows.forEach((r, i) => {
      slot(r, Math.min(i, 3));
      const check = r.querySelector('.row__check');
      if (check) {
        check.disabled = false;
        check.addEventListener('click', () => { if (r === rows[0] && !r.classList.contains('is-done')) { laeuft = false; knopfZeigen(); schritt(); } });
      }
    });
  };
  // Startzustand: Bewegt = noch nichts erledigt; ruhig = Standbild aus dem HTML (1 erledigt, 2 aktiv)
  const reset = () => {
    neuAufbauen();
    if (ruhig) { erledigt = 1; aktiv(1); } else { rows[0].classList.remove('is-done'); erledigt = 0; aktiv(0); }
    zaehlen();
    messen();
  };

  async function schritt() {
    if (beschaeftigt) return;
    beschaeftigt = true;
    if (rows.findIndex(istSchluss) <= 2) { // „Erneut prüfen“ ist sichtbar: Runde vorbei, von vorn
      await warte(2400);
      liste.style.transition = 'opacity 240ms ease'; liste.style.opacity = '0'; await warte(260);
      reset(); liste.style.opacity = '1'; await warte(320); liste.style.transition = '';
      beschaeftigt = false;
      return;
    }
    const fertig = rows[0];
    fertig.classList.remove('is-active');
    fertig.classList.add('is-done');                      // Haken springt auf, Strich wischt, Zeile wird blass
    erledigt += 1; zaehlen();
    await warte(1300);                                      // der Moment, den man sehen soll
    fertig.classList.add('is-leaving'); await warte(150);
    rows.shift();
    rows.forEach((r, i) => {
      if (i === 2) {
        r.classList.add('is-entering'); slot(r, 2); void r.offsetWidth;
        r.style.transitionDelay = '200ms'; r.classList.remove('is-entering');
      } else if (i < 2) { r.style.transitionDelay = `${i * 40}ms`; slot(r, i); }
    });
    await warte(650);
    fertig.remove();
    rows.forEach((r) => { r.style.transitionDelay = ''; });
    aktiv(0);
    beschaeftigt = false;
  }
  // Ruhig: nur Deckkraft, keine Wege; die nächste oberste wird sofort abgehakt
  async function schrittRuhig() {
    if (beschaeftigt) return;
    beschaeftigt = true;
    if (istSchluss(rows[1])) { reset(); beschaeftigt = false; return; }
    const alt = rows.shift();
    alt.classList.add('is-leaving'); await warte(220); alt.remove();
    rows.forEach((r, i) => slot(r, Math.min(i, 3)));
    if (!istSchluss(rows[0])) { rows[0].classList.add('is-done'); erledigt += 1; zaehlen(); }
    aktiv(1);
    beschaeftigt = false;
  }

  knopf.hidden = false;
  knopf.addEventListener('click', () => {
    if (ruhig) { schrittRuhig(); return; }
    laeuft = !laeuft; knopfZeigen();
  });
  fig.addEventListener('pointerenter', () => { schwebt = true; });
  fig.addEventListener('pointerleave', () => { schwebt = false; });
  fig.addEventListener('focusin', () => { fokus = true; });
  fig.addEventListener('focusout', () => { fokus = false; });
  if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { sichtbar = e.isIntersecting; }).observe(fig);
  if ('ResizeObserver' in window) new ResizeObserver(messen).observe(liste);
  document.fonts?.ready.then(messen);
  reset();
  knopfZeigen();
  if (!ruhig) {
    let erster = true;
    const takt = async () => {
      if (laeuft && !schwebt && !fokus && sichtbar && !document.hidden) await schritt();
      setTimeout(takt, erster ? 1800 : 3200);
      erster = false;
    };
    setTimeout(takt, 1800);
  }
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
const FUELL = new Set(['startseite', 'home', 'homepage', 'willkommen', 'index', 'unbenannt']);
// Suchbegriff für den Titel: Schreibweise aus dem Titel übernehmen, sonst Wörter großschreiben (deutsche Begriffe sind meist Nomen)
function gross(keyword, title) {
  const imTitel = new Map((title || '').split(/[\s,:|–—-]+/).filter(Boolean).map((w) => [norm(w), w]));
  return keyword.trim().split(/\s+/).map((w, i) => {
    const n = norm(w);
    if (AKRONYME.has(n)) return w.toUpperCase();
    if (imTitel.has(n)) return imTitel.get(n);
    if (i > 0 && STOP.has(n)) return w.toLowerCase();
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join(' ');
}
function stutzen(s) { return s.replace(/^[ :|,–—-]+|[ :|,–—-]+$/g, '').replace(/\s{2,}/g, ' '); }
// Titelteil ohne die Wörter des Suchbegriffs und ohne übrig gebliebene Verhältniswörter am Ende („… in“)
function ohneStopEnde(woerter) {
  while (woerter.length && STOP.has(norm(woerter[woerter.length - 1]))) woerter.pop();
  return stutzen(woerter.join(' '));
}
function ohneBegriff(teil, keyword) {
  const kw = [...new Set(kern(keyword))];
  const treffer = (w) => kw.includes(norm(w)) || (norm(w).length >= 4 && kw.some((k) => norm(w).startsWith(k)));
  const woerter = [];
  for (const w of teil.split(/\s+/).filter(Boolean)) {
    if (treffer(w)) { if (woerter.length && STOP.has(norm(woerter[woerter.length - 1]))) woerter.pop(); continue; } // „in Hamburg“, „für Freiberufler“ ganz weg
    woerter.push(w);
  }
  return ohneStopEnde(woerter);
}
function kurz(teil) { return ohneStopEnde(teil.split(/,|\s(?:und|mit|seit)\s/)[0].split(/\s+/)); }
function titleVorschlag(keyword, title) {
  // Füllteile („Home“, „Startseite“) fliegen raus; der kürzeste übrige Teil gilt als Name der Firma
  const teile = (title || '').split(/\s[|–—-]\s/).map((t) => t.trim()).filter((t) => t && !FUELL.has(norm(t)));
  let kuerzester = teile.length ? teile.reduce((a, b) => (b.length < a.length ? b : a)) : '';
  // Enthält der kürzeste Teil den Suchbegriff („Friseur in Kiel“), ist eher ein anderer kurzer Teil der Name („Salon Haarscharf“)
  const mitBegriff = (t) => keyword.trim() && woerterIn(keyword, t);
  const andererName = teile.find((t) => t !== kuerzester && !mitBegriff(t) && t.split(/\s+/).length <= 4);
  if (teile.length > 2 && mitBegriff(kuerzester) && andererName) kuerzester = andererName;
  const nurName = teile.length === 1 && kuerzester.split(/\s+/).length <= 3; // „Bäckerei Sommer“ allein ist ein Name, keine Beschreibung
  let marke = teile.length > 1 || nurName ? kuerzester : '';
  marke = stutzen(marke.replace(/^(willkommen (bei|im|in der|in)|herzlich willkommen( bei)?)\s+/i, ''));
  const rest = nurName ? '' : (teile.find((t) => t !== kuerzester) || teile[0] || '');
  const kw = keyword.trim() ? gross(keyword, title) : '';
  const r = kw ? ohneBegriff(rest, keyword) : rest;
  const rk = kurz(r);
  // Leere Teile weglassen, damit nie „Begriff: | Name“ entsteht
  const bau = (vorn, mitte, name) => [vorn && mitte ? `${vorn}: ${mitte}` : vorn || mitte, name].filter(Boolean).join(' | ');
  const kandidaten = kw
    ? [bau(kw, r, marke), bau(kw, rk, marke), bau(kw, '', marke), bau(kw, r, ''), bau(kw, rk, ''), kw]
    : [bau('', r, marke), bau('', rk, marke), rk, marke];
  for (const k of kandidaten) {
    const kandidat = stutzen(k);
    if (kandidat && [...kandidat].length <= TITLE_MAX) return kandidat;
  }
  return stutzen(kw || rk).slice(0, TITLE_MAX);
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
  if (!kw) begriff = 'Trag einen Suchbegriff ein: Wie würde dich ein Kunde bei Google suchen?';
  else {
    const drin = phraseIn(kw, title) || woerterIn(kw, title);
    const nt = norm(title);
    const vorn = nt.indexOf(kern(kw)[0]) <= Math.floor(nt.length / 2);
    if (!drin) begriff = `<strong>Fehlt.</strong> Nimm „${esc(kw)}“ in den Seitentitel auf, möglichst weit vorn. Wirkung hoch.`;
    else if (!vorn) begriff = '<strong>Steht hinten.</strong> Zieh ihn an den Anfang, den Namen deiner Firma nach hinten.';
    else begriff = '<strong>Passt:</strong> steht drin, und zwar vorn.';
    if (!drin || !vorn) vorschlag = titleVorschlag(kw, title);
  }
  // Zu lang ist ein Problem für sich: dann gibt es immer einen gekürzten Vorschlag
  if (!vorschlag && n > TITLE_MAX) vorschlag = titleVorschlag(kw, title);
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
  let beispielBegriff = keyword.value;   // Suchbegriff des gerade gezeigten Beispiels
  const linie = box.querySelector('.typer__line');
  const status = box.querySelector('[data-typer-status]');
  let ansage = '';
  let ansageTimer;
  // Screenreader: kurze Zusammenfassung, erst wenn das Tippen ruht und sich ein Urteil geändert hat
  const ansagen = () => {
    clearTimeout(ansageTimer);
    ansageTimer = setTimeout(() => {
      const neu = `Länge: ${laenge.querySelector('strong')?.textContent || ''} Suchbegriff: ${begriff.querySelector('strong')?.textContent || 'fehlt'}`;
      if (neu !== ansage) { ansage = neu; status.textContent = neu; }
    }, 700);
  };
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
    ansagen();
  };
  const istBeispiel = () => beispiele.some((b) => b.dataset.title === title.value && b.dataset.keyword === keyword.value);
  title.addEventListener('keydown', (e) => { if (e.key === 'Enter') e.preventDefault(); });
  // Wer seinen eigenen Titel tippt, braucht auch seinen eigenen Suchbegriff: den des Beispiels einmal leeren
  title.addEventListener('input', () => {
    if (beispielBegriff !== null && keyword.value === beispielBegriff && !istBeispiel()) { keyword.value = ''; beispielBegriff = null; }
    zeigen();
  });
  // Erster Klick ins Beispiel markiert alles, damit Tippen es ersetzt (am Handy kein langes Löschen)
  title.addEventListener('focus', () => { if (istBeispiel()) requestAnimationFrame(() => title.select()); });
  keyword.addEventListener('input', zeigen);
  window.addEventListener('resize', hoehe);
  beispiele.forEach((b) => b.addEventListener('click', () => {
    if (!istBeispiel()) { eigenerTitel = { t: title.value, k: keyword.value }; eigen.hidden = false; }
    title.value = b.dataset.title;
    keyword.value = b.dataset.keyword;
    beispielBegriff = keyword.value;
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

// Codeblöcke: Kopierknopf
const kopierStatus = document.createElement('p');
kopierStatus.className = 'sr-only';
kopierStatus.setAttribute('role', 'status');
document.body.append(kopierStatus);
document.querySelectorAll('.code').forEach((block) => {
  const knopf = block.querySelector('.code__copy');
  const code = block.querySelector('code');
  if (!knopf || !code) return;
  knopf.hidden = false;
  // Eindeutiger Name je Knopf, sonst hört man achtmal nur „Kopieren“
  knopf.setAttribute('aria-label', `Befehl kopieren: ${code.textContent.trim().split('\n')[0]}`);
  knopf.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(code.textContent.trim()); knopf.textContent = 'Kopiert'; kopierStatus.textContent = 'Befehl kopiert'; } catch { knopf.textContent = 'Markieren und kopieren'; kopierStatus.textContent = 'Kopieren ging nicht, bitte markieren und kopieren'; }
    setTimeout(() => { knopf.textContent = 'Kopieren'; }, 2000);
  });
});
