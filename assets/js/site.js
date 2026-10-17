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
    if (istSchluss(rows[0])) { // alle vier erledigt: erneut prüfen, der Zustand steigt (echte Nachprüfung der Demo-Website)
      const quelle = document.querySelector('[data-vn]');
      const vorher = Number(quelle?.dataset.vorher || 49), nachher = Number(quelle?.dataset.nachher || vorher);
      const zeile = rows[0].querySelector('p');
      const score = fig.querySelector('[data-score]');
      zeile.textContent = 'Prüfe erneut …';
      await warte(900);
      zeile.textContent = 'Nachgeprüft.';
      const start = performance.now();
      await new Promise((ok) => {
        const lauf = (now) => {
          const k = Math.min(1, (now - start) / 900), e = 1 - (1 - k) ** 3;
          score.textContent = String(Math.round(vorher + (nachher - vorher) * e));
          if (k < 1) requestAnimationFrame(lauf); else ok();
        };
        requestAnimationFrame(lauf);
      });
      score.classList.add('is-up');
      score.insertAdjacentHTML('afterend', ` <span class="wjt__delta" data-delta>+${nachher - vorher} nach dem Nachprüfen</span>`);
      zaehler.textContent = '4 von 4 erledigt · nachgeprüft';
      await warte(2800);
      liste.style.transition = 'opacity 240ms ease'; liste.style.opacity = '0'; await warte(260);
      fig.querySelector('[data-delta]')?.remove(); score.classList.remove('is-up'); score.textContent = String(vorher);
      reset(); liste.style.opacity = '1'; await warte(320); liste.style.transition = '';
      beschaeftigt = false;
      return;
    }
    const fertig = rows[0];
    fertig.classList.remove('is-active');
    fertig.classList.add('is-done');                      // Haken springt auf, Strich wischt, Zeile wird blass
    erledigt += 1; zaehlen();
    await warte(850);                                       // der Moment, den man sehen soll
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
    // „Erneut prüfen“ sagt, wann es dran ist
    rows.forEach((r, i) => { if (istSchluss(r)) r.querySelector('p').textContent = i === 0 ? 'Alles erledigt? Dann prüf noch mal.' : 'Danach: erneut prüfen.'; });
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
      setTimeout(takt, erster ? 900 : 1100);
      erster = false;
    };
    setTimeout(takt, 900);
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
  const beschreibung = box.querySelector('#desc-input');
  const serp = { title: box.querySelector('[data-serp="title"]'), desc: box.querySelector('[data-serp="desc"]') };
  const serpName = box.querySelector('[data-serp="name"]'), serpUrl = box.querySelector('[data-serp="url"]');
  // Google kürzt nach Pixelbreite (~600 px Titel, ~920 px Beschreibung); grob über Zeichen angenähert
  const kuerzen = (text, max) => ([...text].length > max ? `${[...text].slice(0, max - 1).join('').replace(/\s+\S*$/, '')} …` : text);
  const vorschau = () => {
    if (!serp.title) return;
    serp.title.textContent = kuerzen(title.value.replace(/\s*\n\s*/g, ' ').trim() || 'Ohne Titel', 60);
    const eigen = !beispiele.some((b) => b.dataset.title === title.value);
    serpName.textContent = eigen ? 'deine-website.de' : 'radhaus-elbe.de';
    serpUrl.textContent = eigen ? 'https://deine-website.de' : 'https://radhaus-elbe.de';
    serp.desc.textContent = beschreibung ? kuerzen(beschreibung.value.trim(), 158) : '';
  };
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
    vorschau();
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
  beschreibung?.addEventListener('input', vorschau);
  window.addEventListener('resize', hoehe);
  beispiele.forEach((b) => b.addEventListener('click', () => {
    if (!istBeispiel()) { eigenerTitel = { t: title.value, k: keyword.value, d: beschreibung?.value || '' }; eigen.hidden = false; }
    title.value = b.dataset.title;
    keyword.value = b.dataset.keyword;
    if (beschreibung) beschreibung.value = b.dataset.desc || '';
    beispielBegriff = keyword.value;
    zeigen();
  }));
  eigen.addEventListener('click', () => {
    if (!eigenerTitel) return;
    title.value = eigenerTitel.t;
    keyword.value = eigenerTitel.k;
    if (beschreibung) beschreibung.value = eigenerTitel.d;
    zeigen();
    title.focus();
  });
  kopieren.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(vorschlag.textContent); kopieren.textContent = 'Kopiert'; } catch { kopieren.textContent = 'Kopieren ging nicht'; }
  });
  zeigen();
})();

// Szene „Rauschen → Fokus“: eine Wolke aus Partikeln, aus der sich die nächste Aufgabe herausschält.
// Canvas 2D ohne Bibliothek; pausiert außerhalb des Bildes, drosselt sich auf schwachen Geräten, reduziert = Standbild.
(() => {
  const buehne = document.querySelector('[data-fokus]');
  if (!buehne) return;
  const canvas = buehne.querySelector('canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const elTask = buehne.querySelector('[data-task]');
  const elMeta = buehne.querySelector('[data-meta]');
  const elLabel = buehne.querySelector('[data-label]');
  const hudL = buehne.querySelector('[data-hud-l]');
  const knopf = buehne.querySelector('[data-fokus-ctrl]');

  // Die echten ersten Aufgaben der Demo-Prüfung (aus „Was jetzt tun“)
  const AUFGABEN = [
    { t: 'Bau 9 Seiten mit wenig Text aus', m: 'Wichtig · <span class="hoch">Wirkung hoch</span> · machst du selbst' },
    { t: 'Gib 4 Seiten eigene Beschreibungen', m: 'Dringend · <span class="hoch">Wirkung hoch</span> · kurz je Seite' },
    { t: 'Entferne fehlerhafte Adressen aus der Sitemap', m: 'Dringend · Wirkung mittel · für deine Technik' },
  ];
  const ZEICHEN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜabcdefghijklmnopqrstuvwxyz0123456789#%&/<>{}[]';

  let W = 0, H = 0, dpr = 1, punkte = [], maus = { x: -9999, y: -9999 }, sichtbar = true, laeuft = !ruhig;
  let phase = 'rauschen', phaseStart = 0, aufgabe = 0, fokus = 0;  // fokus 0..1 = wie stark die Wolke zur Mitte zieht

  // Farben: Markenviolett, helles Violett, Weiß – additiv gemischt ergibt das den Schein
  const FARBEN = ['#5B3FBF', '#9D8CF0', '#C7B9FF', '#FFFFFF'];
  let gruppen = [];  // gleiche Farbe + Grundhelligkeit = ein fillStyle je Gruppe (schnell)

  function zufallNormal() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

  function aufbauen() {
    const r = buehne.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = Math.round(r.width); H = Math.round(r.height);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const anzahl = Math.round(Math.min(11000, Math.max(3500, W * H / 65)) * (matchMedia('(pointer: coarse)').matches ? 0.45 : 1));
    glanzBauen();
    // Nebel aus mehreren Wolken: dicht in der Mitte, ausfransend nach außen
    const wolken = [[0.5, 0.5, 0.26, 0.5], [0.32, 0.42, 0.16, 0.18], [0.7, 0.58, 0.18, 0.18], [0.45, 0.68, 0.14, 0.14]];
    punkte = Array.from({ length: anzahl }, () => {
      let w = wolken[0], z = Math.random(), s = 0;
      for (const k of wolken) { s += k[3]; if (z <= s) { w = k; break; } }
      const hx = (w[0] + zufallNormal() * w[2]) * W, hy = (w[1] + zufallNormal() * w[2] * 0.62) * H;
      const hell = Math.random();
      return { hx, hy, x: hx, y: hy, vx: 0, vy: 0, p: Math.random() * Math.PI * 2, f: 0.25 + Math.random() * 0.9, r: 6 + Math.random() * 22,
        g: Math.random() < 0.06 ? 2.4 : 1 + Math.random() * 0.9, c: hell < 0.42 ? 0 : hell < 0.74 ? 1 : hell < 0.92 ? 2 : 3, a: Math.floor(Math.random() * 4) };
    });
    gruppen = [];
    for (let c = 0; c < 4; c++) for (let a = 0; a < 4; a++) gruppen.push({ farbe: FARBEN[c], hell: 0.2 + a * 0.15, p: Math.random() * 6.3, f: 0.6 + Math.random() * 1.2, liste: punkte.filter((q) => q.c === c && q.a === a) });
  }

  // Weicher Nebel: wenige große, unscharfe Lichtflecken (einmal gerendert, dann nur verschoben)
  let fleck = null, flecken = [];
  function glanzBauen() {
    fleck = document.createElement('canvas'); fleck.width = fleck.height = 256;
    const g = fleck.getContext('2d'), v = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    v.addColorStop(0, 'rgba(170,150,255,0.55)'); v.addColorStop(0.35, 'rgba(110,80,220,0.22)'); v.addColorStop(1, 'rgba(91,63,191,0)');
    g.fillStyle = v; g.fillRect(0, 0, 256, 256);
    flecken = Array.from({ length: 26 }, (_, i) => ({ x: 0.5 + zufallNormal() * 0.2, y: 0.5 + zufallNormal() * 0.16, s: 0.25 + Math.random() * 0.45, p: Math.random() * 6.3, f: 0.08 + Math.random() * 0.18, w: i < 4 ? 1 : 0.55 }));
  }

  // Text „entschlüsseln“: jedes Zeichen rauscht, bis es an der Reihe ist
  function entschluesseln(el, html, dauer = 900) {
    const id = (el._dec = (el._dec || 0) + 1), ziel = document.createElement('span'); ziel.innerHTML = html;
    const klar = ziel.textContent, start = performance.now();
    const schritt = (now) => {
      if (id !== el._dec) return;
      const t = Math.min(1, (now - start) / dauer);
      const fertig = Math.floor(klar.length * t);
      if (t >= 1) { el.innerHTML = html; return; }
      let rest = '';
      for (let i = fertig; i < klar.length; i++) rest += klar[i] === ' ' ? ' ' : ZEICHEN[(Math.random() * ZEICHEN.length) | 0];
      el.textContent = klar.slice(0, fertig);
      const s = document.createElement('span'); s.className = 'scr'; s.textContent = rest; el.append(s);
      requestAnimationFrame(schritt);
    };
    requestAnimationFrame(schritt);
  }
  function zeigeAufgabe(i, sofort) {
    const a = AUFGABEN[i];
    elLabel.textContent = `Als Nächstes · ${i + 1} von 8`;
    if (sofort) { elTask.textContent = a.t; elMeta.innerHTML = a.m; return; }
    entschluesseln(elTask, a.t, 950);
    setTimeout(() => entschluesseln(elMeta, a.m, 600), 380);
  }

  // Scanlinien: eine wandernde, ab und zu kurze Störstreifen
  let scanY = -1, stoer = [];
  function zeichnen(now) {
    const t = now / 1000;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(18,17,23,0.38)';           // Nachleuchten statt hartem Löschen
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    const cx = W / 2, cy = H / 2, zug = fokus;
    // Nebel atmet; im Fokus wird der Kern um den Rahmen heller
    for (const f of flecken) {
      const s = f.s * Math.max(W, H) * (1 + 0.08 * Math.sin(t * f.f * 3 + f.p)), x = (f.x + Math.cos(t * f.f + f.p) * 0.03) * W, y = (f.y + Math.sin(t * f.f * 0.9 + f.p) * 0.03) * H;
      ctx.globalAlpha = 0.16 * f.w * (1 + zug * 0.9);
      ctx.drawImage(fleck, x - s / 2, y - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
    const rand = [];
    for (const gr of gruppen) {
      ctx.fillStyle = gr.farbe;
      ctx.globalAlpha = Math.min(1, gr.hell * (0.7 + 0.3 * Math.sin(t * gr.f + gr.p)) * (1 + zug * 0.2));
      for (const q of gr.liste) {
        // Atmen: jede Partikel kreist langsam um ihren Platz; im Fokus zieht die Wolke zur Mitte und lässt den Rahmen frei
        let zx = q.hx + Math.cos(t * q.f + q.p) * q.r, zy = q.hy + Math.sin(t * q.f * 0.8 + q.p) * q.r * 0.7;
        if (zug > 0.01) {
          zx += (cx - zx) * zug * 0.18; zy += (cy - zy) * zug * 0.18;
          const fx = Math.abs(zx - cx) / (W * 0.24), fy = Math.abs(zy - cy) / (H * 0.2), m = fx > fy ? fx : fy;
          if (m < 1) { const k = zug * 34 * (1 - m); zx += (zx < cx ? -1.6 : 1.6) * k; zy += (zy < cy ? -1 : 1) * k; }
          else if (m < 1.35) rand.push(q);
        }
        const dx = q.x - maus.x, dy = q.y - maus.y, d2 = dx * dx + dy * dy;
        if (d2 < 14400) { const d = Math.sqrt(d2) || 1, s = (120 - d) / 120 * 2.4; q.vx += dx / d * s; q.vy += dy / d * s; }
        q.vx = (q.vx + (zx - q.x) * 0.045) * 0.86; q.vy = (q.vy + (zy - q.y) * 0.045) * 0.86;
        q.x += q.vx; q.y += q.vy;
        ctx.fillRect(q.x, q.y, q.g, q.g);
      }
    }
    // Lichtsaum um den Rahmen: die Partikel direkt außen herum leuchten weiß nach
    if (rand.length) { ctx.fillStyle = '#FFFFFF'; ctx.globalAlpha = 0.45 * zug; for (const q of rand) ctx.fillRect(q.x, q.y, q.g, q.g); }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    if (scanY >= 0) {
      ctx.fillStyle = 'rgba(199,185,255,0.55)'; ctx.fillRect(0, scanY, W, 1);
      ctx.fillStyle = 'rgba(199,185,255,0.08)'; ctx.fillRect(0, scanY - 14, W, 14);
      scanY += H / 55; if (scanY > H) scanY = -1;
    }
    if (Math.random() < 0.03) stoer.push({ y: Math.random() * H, w: 0.3 + Math.random() * 0.7, bis: now + 60 + Math.random() * 90 });
    stoer = stoer.filter((s) => s.bis > now);
    for (const s of stoer) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(W * (1 - s.w) * Math.random(), s.y, W * s.w, 1); }
  }

  // Ablauf: Rauschen → Fokus (Rahmen, Scan, Text) → Halten → Lösen → nächste Aufgabe
  const DAUER = { rauschen: 2600, fokus: 900, halten: 2600, loesen: 900 };
  function takt(now) {
    const dt = now - phaseStart;
    if (phase === 'rauschen' && dt > DAUER.rauschen) {
      phase = 'fokus'; phaseStart = now; buehne.classList.add('is-focus'); scanY = 0;
      hudL.innerHTML = '<b>43</b> Fundstellen → <b>8</b> Aufgaben'; zeigeAufgabe(aufgabe);
    } else if (phase === 'fokus' && dt > DAUER.fokus) { phase = 'halten'; phaseStart = now; }
    else if (phase === 'halten' && dt > DAUER.halten) { phase = 'loesen'; phaseStart = now; buehne.classList.remove('is-focus'); }
    else if (phase === 'loesen' && dt > DAUER.loesen) {
      phase = 'rauschen'; phaseStart = now; aufgabe = (aufgabe + 1) % AUFGABEN.length;
      hudL.innerHTML = '<b>43</b> Fundstellen · 16 Prüfungen · 17 Seiten';
    }
    const ziel = phase === 'fokus' || phase === 'halten' ? 1 : 0;
    fokus += (ziel - fokus) * 0.06;
  }

  let rafId = 0, zuletzt = 0, proben = [], gedrosselt = false;
  // Schwaches Gerät? Nach 40 Bildern messen und bei Bedarf jede zweite Partikel weglassen
  function drosseln() {
    gedrosselt = true;
    for (const gr of gruppen) gr.liste = gr.liste.filter((_, i) => i % 2 === 0);
  }
  function schleife(now) {
    rafId = 0;
    if (!laeuft || !sichtbar || document.hidden) { zuletzt = 0; return; }
    if (!phaseStart) phaseStart = now;
    if (zuletzt && !gedrosselt) { proben.push(now - zuletzt); if (proben.length === 40) { proben.sort((x, y) => x - y); if (proben[20] > 24) drosseln(); else gedrosselt = true; } }
    zuletzt = now;
    takt(now); zeichnen(now);
    rafId = requestAnimationFrame(schleife);
  }
  const weiter = () => { if (!rafId && laeuft && sichtbar && !document.hidden) { phaseStart = performance.now() - (performance.now() - phaseStart); rafId = requestAnimationFrame(schleife); } };

  // Standbild: Wolke im Fokus, erste Aufgabe lesbar
  function standbild() {
    fokus = 1; buehne.classList.add('is-focus'); zeigeAufgabe(0, true);
    hudL.innerHTML = '<b>43</b> Fundstellen → <b>8</b> Aufgaben';
    ctx.fillStyle = '#121117'; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 60; i++) zeichnen(i * 16);
  }

  aufbauen();
  ctx.fillStyle = '#121117'; ctx.fillRect(0, 0, W, H);
  new ResizeObserver(() => { aufbauen(); if (!laeuft) standbild(); }).observe(buehne);
  new IntersectionObserver(([e]) => { sichtbar = e.isIntersecting; weiter(); }).observe(buehne);
  document.addEventListener('visibilitychange', weiter);
  buehne.addEventListener('pointermove', (e) => { const r = buehne.getBoundingClientRect(); maus.x = e.clientX - r.left; maus.y = e.clientY - r.top; });
  buehne.addEventListener('pointerleave', () => { maus.x = maus.y = -9999; });
  knopf.addEventListener('click', () => {
    laeuft = !laeuft; knopf.textContent = laeuft ? 'Anhalten' : 'Abspielen';
    knopf.setAttribute('aria-pressed', String(!laeuft)); if (laeuft) weiter();
  });
  knopf.hidden = false;
  if (ruhig) { knopf.textContent = 'Abspielen'; knopf.setAttribute('aria-pressed', 'true'); standbild(); }
  else rafId = requestAnimationFrame(schleife);
})();

// Durchlauf-Video: läuft stumm, sobald es im Bild ist (bei reduzierter Bewegung nur auf Klick); Kapitel springen an die Stelle
(() => {
  const v = document.querySelector('[data-video]');
  if (!v) return;
  document.querySelectorAll('[data-zeit]').forEach((k) => k.addEventListener('click', () => { v.currentTime = Number(k.dataset.zeit); v.play(); }));
  if (ruhig || !('IntersectionObserver' in window)) return;
  v.loop = true;
  new IntersectionObserver(([e]) => { if (e.isIntersecting) { v.preload = 'auto'; v.play().catch(() => {}); } else v.pause(); }, { threshold: 0.5 }).observe(v);
})();

// E-Mail an den Webbetreuer: Text auch zum Kopieren (falls kein Mailprogramm eingerichtet ist)
(() => {
  const mail = document.querySelector('[data-mail]');
  const kopie = document.querySelector('[data-mail-copy]');
  if (!mail || !kopie || !navigator.clipboard) return;
  const text = decodeURIComponent(new URL(mail.href).searchParams.get('body') || '');
  kopie.hidden = false;
  kopie.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(text); kopie.textContent = 'Kopiert'; } catch { kopie.textContent = 'Kopieren ging nicht'; }
    setTimeout(() => { kopie.textContent = 'Text kopieren'; }, 2000);
  });
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
