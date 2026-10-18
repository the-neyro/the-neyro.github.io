// Nextfix-Website: das bisschen Skript, das die Seite braucht.
// Ohne JavaScript bleibt alles lesbar; jede Funktion prüft, ob ihr Element existiert.

window.nextfixOk = true; // Gegenstück zum Sicherheitsnetz im <head>
const ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// Symbole für Anhalten/Abspielen (Held-Panel und Video)
const ICON_PAUSE = '<svg viewBox="0 0 12 12" aria-hidden="true"><rect x="2" y="1.5" width="2.6" height="9" fill="currentColor"/><rect x="7.4" y="1.5" width="2.6" height="9" fill="currentColor"/></svg>';
const ICON_PLAY = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.5v9l7.5-4.5z" fill="currentColor"/></svg>';

// Handy: Die Kopfzeile hat nur Platz für „Mehr“ und „Installieren“; „Mehr“ klappt die übrigen Links auf
(() => {
  const nav = document.querySelector('.site-nav');
  const weit = nav ? [...nav.querySelectorAll('a:not(.button)')] : [];
  if (!weit.length) return;
  const knopf = document.createElement('button');
  knopf.type = 'button'; knopf.className = 'nav-more'; knopf.textContent = 'Mehr';
  knopf.setAttribute('aria-expanded', 'false'); knopf.setAttribute('aria-controls', 'nav-mehr');
  const menue = document.createElement('div');
  menue.id = 'nav-mehr'; menue.className = 'nav-menu';
  weit.forEach((a) => { const k = a.cloneNode(true); k.classList.remove('nav-wide'); menue.append(k); });
  nav.querySelector('.button')?.before(knopf);
  nav.after(menue);
  const zu = () => { menue.removeAttribute('data-open'); knopf.setAttribute('aria-expanded', 'false'); };
  knopf.addEventListener('click', () => {
    const auf = !menue.hasAttribute('data-open');
    menue.toggleAttribute('data-open', auf); knopf.setAttribute('aria-expanded', String(auf));
    if (auf) menue.querySelector('a')?.focus();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menue.hasAttribute('data-open')) { zu(); knopf.focus(); } });
  document.addEventListener('click', (e) => { if (!menue.contains(e.target) && e.target !== knopf) zu(); });
})();

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
  }, { rootMargin: '0px 0px 8% 0px', threshold: 0 }); // kurz bevor es ins Bild kommt, damit man nie auf Leere scrollt
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

// Szene „43 Fundstellen → 8 Aufgaben“: die echten Fundstellen der Demo-Prüfung als Punkte.
// Sie liegen erst verstreut, sortieren sich dann in 8 Aufgaben (plus Feinschliff), und eine Aufgabe nach der anderen wird zur Karte.
// Canvas 2D ohne Bibliothek; pausiert außerhalb des Bildes, reduzierte Bewegung = Standbild.
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

  // Fundstellen je Prüfung, wie Nextfix sie für „Radhaus Elbe“ gefunden hat (content/demo-fundstellen.json)
  const FUNDE = {
    wenig_text: ["/angebote", "/blog", "/blog/winter-check", "/datenschutz", "/faq", "/impressum", "/kontakt", "/preise", "/ueber-uns"],
    meta_desc_doppelt: ["/blog", "/blog/winter-check", "/preise", "/ueber-uns"],
    sitemap_falsche_seiten: ["/fahrradleasing"],
    status_4xx: ["/fruehjahrsaktion-2025"],
    interne_links_defekt: ["/angebote"],
    bilder_ohne_alt: ["/", "/e-bikes", "/ueber-uns"],
    title_zu_lang: ["/blog/reifendruck", "/leihraeder"],
    meta_desc_fehlt: ["/kontakt"],
    meta_desc_zu_kurz: ["/angebote", "/blog", "/blog/kette-oelen", "/blog/winter-check", "/datenschutz", "/faq", "/impressum", "/preise", "/ueber-uns"],
    ki_fragen_ohne_faq: ["/blog/kette-oelen", "/faq", "/werkstatt"],
    nur_ein_eingehender_link: ["/blog/kette-oelen", "/blog/reifendruck", "/blog/winter-check"],
    orphan_sitemap: ["/angebote", "/ueber-uns"],
    perm_redirect: ["/fahrradleasing"],
    ki_artikel_ohne_autor_datum: ["/blog/reifendruck"],
    ohne_last_modified: ["(ganze Website)"],
    llms_fehlt: ["(ganze Website)"],
  };
  // Die 8 Aufgaben aus „Was jetzt tun“ in ihrer Reihenfolge; alles andere ist Feinschliff
  const AUFGABEN = [
    { check: 'wenig_text', kurz: 'wenig Text', t: 'Bau 9 Seiten mit wenig Text aus', m: 'Wichtig · <span class="hoch">Wirkung hoch</span> · machst du selbst' },
    { check: 'meta_desc_doppelt', kurz: 'Beschreibung doppelt', t: 'Gib 4 Seiten eigene Beschreibungen', m: 'Dringend · <span class="hoch">Wirkung hoch</span> · kurz je Seite' },
    { check: 'sitemap_falsche_seiten', kurz: 'falsch in der Sitemap', t: 'Entferne fehlerhafte Adressen aus der Sitemap', m: 'Dringend · Wirkung mittel · für deine Technik' },
    { check: 'status_4xx', kurz: 'nicht gefunden (404)', t: 'Behebe 1 Seite mit „nicht gefunden“ (404)', m: 'Dringend · Wirkung mittel · kurz je Seite' },
    { check: 'interne_links_defekt', kurz: 'defekter Link', t: 'Repariere defekte interne Links auf 1 Seite', m: 'Dringend · Wirkung mittel · kurz je Seite' },
    { check: 'bilder_ohne_alt', kurz: 'Bild ohne alt-Text', t: 'Ergänze Bildbeschreibungen (alt) auf 3 Seiten', m: 'Wichtig · Wirkung gering · kurz je Seite' },
    { check: 'title_zu_lang', kurz: 'Titel zu lang', t: 'Kürze den Seitentitel von 2 Seiten auf 70 Zeichen', m: 'Wichtig · Wirkung gering · kurz je Seite' },
    { check: 'meta_desc_fehlt', kurz: 'Beschreibung fehlt', t: 'Schreib eine Beschreibung für 1 Seite', m: 'Wichtig · Wirkung gering · kurz je Seite' },
  ];
  const FEIN = { meta_desc_zu_kurz: 'Beschreibung kurz', ki_fragen_ohne_faq: 'Fragen ohne FAQ', nur_ein_eingehender_link: 'nur ein Link hierher',
    orphan_sitemap: 'nur in der Sitemap', perm_redirect: 'Link auf alte Adresse', ki_artikel_ohne_autor_datum: 'ohne Autor/Datum',
    ohne_last_modified: 'kein Last-Modified', llms_fehlt: 'llms.txt fehlt' };
  const ZEICHEN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜabcdefghijklmnopqrstuvwxyz0123456789#%&/<>{}[]';
  const MONO = '"Fira Mono", ui-monospace, monospace';

  // Ein Punkt je Fundstelle: g = Aufgabe 0–7 oder 8 = Feinschliff
  const punkte = [];
  AUFGABEN.forEach((a, g) => FUNDE[a.check].forEach((pfad, i) => punkte.push({ g, i, text: `${pfad} · ${a.kurz}` })));
  let fi = 0;
  for (const [check, kurz] of Object.entries(FEIN)) FUNDE[check].forEach((pfad) => punkte.push({ g: 8, i: fi++, text: `${pfad} · ${kurz} · Feinschliff` }));
  const staub = [];

  let W = 0, H = 0, dpr = 1, schmal = false, maus = { x: -9999, y: -9999 }, sichtbar = true, laeuft = !ruhig;
  let phase = 'streuen', phaseStart = 0, aufgabe = 0, mitten = [];

  // Ziele: verstreut (zufällig, ohne Kopfzeile) oder sortiert (8 Häufchen in einer Reihe bzw. 2 × 4, Feinschliff als Zeile unten)
  function streuziele() {
    for (const q of punkte) { q.sx = W * (0.06 + Math.random() * 0.88); q.sy = H * (0.15 + Math.random() * 0.72); q.p = Math.random() * 6.3; q.verz = Math.random() * 500; }
  }
  function sortierziele() {
    mitten = AUFGABEN.map((_, g) => schmal
      ? { x: W * (0.14 + (g % 4) * 0.24), y: H * (g < 4 ? 0.6 : 0.75) }
      : { x: W * (0.07 + g * (0.86 / 7)), y: H * 0.68 });
    const abst = schmal ? 7 : 12;
    for (const q of punkte) {
      if (q.g < 8) {
        // Sonnenblumen-Anordnung: dicht und rund, egal wie viele Punkte
        const r = abst * 0.62 * Math.sqrt(q.i + (q.i ? 0.5 : 0)), w = q.i * 2.39996;
        q.tx = mitten[q.g].x + Math.cos(w) * r; q.ty = mitten[q.g].y + Math.sin(w) * r;
      } else {
        q.tx = W * (schmal ? 0.07 : 0.5) + (schmal ? q.i * abst : (q.i - 10) * abst); q.ty = H * (schmal ? 0.92 : 0.9);
      }
    }
  }

  function aufbauen() {
    const r = buehne.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.round(r.width); H = Math.round(r.height); schmal = W < 640;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    staub.length = 0;
    for (let i = 0; i < Math.round(W * H / 3200); i++) staub.push({ x: Math.random() * W, y: Math.random() * H, a: 0.08 + Math.random() * 0.2, p: Math.random() * 6.3, f: 0.1 + Math.random() * 0.3 });
    streuziele(); sortierziele();
    for (const q of punkte) if (q.x === undefined) { q.x = q.sx; q.y = q.sy; q.vx = q.vy = 0; q.hell = 0.75; }
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
    elLabel.textContent = i === 0 ? 'Als Nächstes · 1 von 8' : `Danach · ${i + 1} von 8`;
    if (sofort) { elTask.textContent = a.t; elMeta.innerHTML = a.m; return; }
    entschluesseln(elTask, a.t, 700);
    setTimeout(() => entschluesseln(elMeta, a.m, 450), 250);
  }

  function zeichnen(now) {
    const t = now / 1000, sortiert = phase !== 'streuen', dt = now - phaseStart;
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#121117'; ctx.fillRect(0, 0, W, H);
    // Staub: leiser Hintergrund, damit die Bühne nicht leer wirkt
    ctx.fillStyle = '#8f86c9';
    for (const s of staub) { ctx.globalAlpha = s.a * (0.7 + 0.3 * Math.sin(t * s.f + s.p)); ctx.fillRect(s.x, s.y, 1, 1); }
    // Verbindung von der aktiven Gruppe zur Karte
    const zeigt = phase === 'zeigen';
    if (zeigt && mitten[aufgabe]) {
      const m = mitten[aufgabe], kante = buehne.querySelector('.fokus__frame').getBoundingClientRect(), b = buehne.getBoundingClientRect();
      const kx = Math.min(Math.max(m.x, kante.left - b.left + 16), kante.right - b.left - 16), ky = kante.bottom - b.top + 6, a = Math.min(1, dt / 400);
      ctx.globalAlpha = 0.35 * a; ctx.strokeStyle = '#c7b9ff'; ctx.lineWidth = 1; ctx.setLineDash([2, 4]);
      ctx.beginPath(); ctx.moveTo(m.x, m.y - (schmal ? 20 : 30)); ctx.lineTo(kx, ky); ctx.stroke(); ctx.setLineDash([]);
    }
    // Punkte: federn zu ihrem Ziel; die aktive Aufgabe leuchtet weiß und hebt sich leicht
    let nah = null, nahD = 196;
    for (const q of punkte) {
      // Beim Sortieren fliegen die Punkte leicht versetzt los, danach bleiben sie an ihrem Platz
      const amZiel = sortiert && (phase !== 'sortieren' || dt > q.verz);
      let zx = amZiel ? q.tx : q.sx, zy = amZiel ? q.ty : q.sy;
      if (!sortiert) { zx += Math.cos(t * 0.5 + q.p) * 6; zy += Math.sin(t * 0.4 + q.p) * 5; }
      const aktiv = zeigt && q.g === aufgabe;
      if (aktiv) zy -= 6;
      q.vx = (q.vx + (zx - q.x) * 0.05) * 0.8; q.vy = (q.vy + (zy - q.y) * 0.05) * 0.8;
      q.x += q.vx; q.y += q.vy;
      const ziel = !sortiert ? 0.85 : q.g === 8 ? 0.4 : !zeigt ? 0.8 : aktiv ? 1 : 0.45;
      q.hell += (ziel - q.hell) * 0.08;
      const d2 = (q.x - maus.x) ** 2 + (q.y - maus.y) ** 2;
      if (d2 < nahD) { nahD = d2; nah = q; }
    }
    for (const q of punkte) {
      const aktiv = zeigt && q.g === aufgabe, r = (schmal ? 2.6 : 4) * (aktiv ? 1.25 : 1) * (q === nah ? 1.4 : 1);
      ctx.globalAlpha = q.hell;
      if (aktiv) { ctx.fillStyle = 'rgba(199,185,255,0.14)'; ctx.beginPath(); ctx.arc(q.x, q.y, r * 2.2, 0, 6.29); ctx.fill(); }
      ctx.fillStyle = q.g === 8 ? '#9f9bb0' : aktiv || !sortiert ? '#ffffff' : '#c7b9ff';
      ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, 6.29); ctx.fill();
    }
    // Beschriftung: Nummer unter jeder Aufgabe, „Feinschliff“ an der Zeile
    if (sortiert) {
      const a = Math.min(1, dt / 700);
      ctx.font = `500 ${schmal ? 10 : 11}px ${MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      const mitNamen = W >= 1150, anzahl = (g) => FUNDE[AUFGABEN[g].check].length;
      mitten.forEach((m, g) => {
        const an = zeigt && g === aufgabe, y = m.y + (schmal ? 20 : 34);
        ctx.globalAlpha = a * (an ? 1 : 0.75); ctx.fillStyle = an ? '#ffffff' : '#9f9bb0';
        ctx.fillText(mitNamen ? `${g + 1} · ${anzahl(g)}×` : String(g + 1), m.x, y);
        if (mitNamen) ctx.fillText(AUFGABEN[g].kurz, m.x, y + 17);
      });
      ctx.globalAlpha = a * 0.8; ctx.fillStyle = '#9f9bb0'; ctx.textBaseline = 'bottom';
      const fein = punkte.find((q) => q.g === 8 && q.i === 0);
      ctx.textAlign = 'left';
      ctx.fillText('Feinschliff · zählt nicht in den Zustand', fein.tx - 4, fein.ty - 9);
    }
    // Maus über einem Punkt: welche Seite, welches Problem
    if (nah) {
      ctx.font = `500 12px ${MONO}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      const w = ctx.measureText(nah.text).width + 16, x = Math.min(Math.max(8, nah.x - w / 2), W - w - 8), y = nah.y - 30 < 40 ? nah.y + 16 : nah.y - 34;
      ctx.globalAlpha = 0.94; ctx.fillStyle = '#26242f'; ctx.fillRect(x, y, w, 22);
      ctx.globalAlpha = 1; ctx.fillStyle = '#ffffff'; ctx.fillText(nah.text, x + 8, y + 11.5);
    }
    ctx.globalAlpha = 1;
  }

  // Ablauf: verstreut → sortieren → Aufgabe 1 bis 8 als Karte → lösen → von vorn
  const DAUER = { streuen: 2600, sortieren: 1500, zeigen: 2700, loesen: 900 };
  function takt(now) {
    const dt = now - phaseStart;
    if (phase === 'streuen' && dt > DAUER.streuen) {
      phase = 'sortieren'; phaseStart = now; sortierziele();
      hudL.innerHTML = '<b>43</b> Fundstellen → <b>8</b> Aufgaben + Feinschliff';
    } else if (phase === 'sortieren' && dt > DAUER.sortieren) {
      phase = 'zeigen'; phaseStart = now; aufgabe = 0; buehne.classList.add('is-focus'); zeigeAufgabe(0);
    } else if (phase === 'zeigen' && dt > DAUER.zeigen * (aufgabe === 0 ? 1.4 : 1)) {
      if (aufgabe < AUFGABEN.length - 1) { aufgabe++; phaseStart = now; zeigeAufgabe(aufgabe); }
      else { phase = 'loesen'; phaseStart = now; buehne.classList.remove('is-focus'); }
    } else if (phase === 'loesen' && dt > DAUER.loesen) {
      phase = 'streuen'; phaseStart = now; streuziele();
      hudL.innerHTML = '<b>43</b> Fundstellen · 16 Prüfungen · 17 Seiten';
    }
  }

  let rafId = 0, pauseAb = 0;
  function schleife(now) {
    rafId = 0;
    if (!laeuft || !sichtbar || document.hidden) { if (!pauseAb) pauseAb = now; return; }
    if (!phaseStart) phaseStart = now;
    if (pauseAb) { phaseStart += now - pauseAb; pauseAb = 0; } // nach einer Pause dort weiter, wo es war
    takt(now); zeichnen(now);
    rafId = requestAnimationFrame(schleife);
  }
  const weiter = () => { if (!rafId && laeuft && sichtbar && !document.hidden) rafId = requestAnimationFrame(schleife); };

  // Standbild: sortiert, erste Aufgabe als Karte
  function standbild() {
    phase = 'zeigen'; aufgabe = Math.min(aufgabe, AUFGABEN.length - 1); phaseStart = performance.now() - 1000;
    buehne.classList.add('is-focus'); zeigeAufgabe(aufgabe, true); sortierziele();
    hudL.innerHTML = '<b>43</b> Fundstellen → <b>8</b> Aufgaben + Feinschliff';
    for (const q of punkte) { q.x = q.tx; q.y = q.ty; q.vx = q.vy = 0; q.hell = q.g === 8 ? 0.4 : q.g === aufgabe ? 1 : 0.45; q.verz = 0; }
    zeichnen(phaseStart + 1000);
  }
  const ruhend = () => !laeuft || ruhig;

  aufbauen();
  ctx.fillStyle = '#121117'; ctx.fillRect(0, 0, W, H);
  new ResizeObserver(() => { aufbauen(); if (ruhend()) standbild(); }).observe(buehne);
  new IntersectionObserver(([e]) => { sichtbar = e.isIntersecting; weiter(); }).observe(buehne);
  document.addEventListener('visibilitychange', weiter);
  buehne.addEventListener('pointermove', (e) => {
    const r = buehne.getBoundingClientRect(); maus.x = e.clientX - r.left; maus.y = e.clientY - r.top;
    if (ruhend()) zeichnen(performance.now());
  });
  buehne.addEventListener('pointerleave', () => { maus.x = maus.y = -9999; if (ruhend()) zeichnen(performance.now()); });
  const knopfZeigen = () => { knopf.innerHTML = laeuft ? `${ICON_PAUSE}Anhalten` : `${ICON_PLAY}Abspielen`; knopf.setAttribute('aria-pressed', String(!laeuft)); };
  knopf.addEventListener('click', () => { laeuft = !laeuft; knopfZeigen(); if (laeuft) weiter(); });
  knopf.hidden = false;
  knopfZeigen();
  if (ruhig) standbild();
  else rafId = requestAnimationFrame(schleife);
  if (document.fonts) document.fonts.load(`500 11px ${MONO}`).then(() => { if (ruhend()) standbild(); });
})();

// Durchlauf-Video: läuft stumm in Schleife, sobald es im Bild ist (bei reduzierter Bewegung nur auf Klick).
// Eigener Knopf statt Browser-Steuerung; Kapitel springen an die Stelle und zeigen, wo das Video gerade ist.
(() => {
  const v = document.querySelector('[data-video]');
  const knopf = document.querySelector('[data-video-ctrl]');
  if (!v || !knopf) return;
  const kapitel = [...document.querySelectorAll('[data-zeit]')];
  v.controls = false;
  v.loop = true;
  knopf.hidden = false;
  let vonHand = false; // Wer selbst anhält, dem startet das Scrollen nichts neu
  const zeigen = () => {
    const pausiert = v.paused;
    knopf.innerHTML = pausiert ? `${ICON_PLAY}<span class="video__ctrl-text">Abspielen</span>` : `${ICON_PAUSE}<span class="video__ctrl-text">Anhalten</span>`;
    knopf.setAttribute('aria-label', pausiert ? 'Video abspielen' : 'Video anhalten');
  };
  const abspielen = () => { v.preload = 'auto'; v.play().catch(() => {}); };
  v.addEventListener('play', zeigen);
  v.addEventListener('pause', zeigen);
  v.addEventListener('timeupdate', () => {
    let aktiv = kapitel[0];
    kapitel.forEach((k) => { if (v.currentTime >= Number(k.dataset.zeit)) aktiv = k; });
    kapitel.forEach((k) => k.toggleAttribute('aria-current', k === aktiv && v.currentTime > 0));
  });
  knopf.addEventListener('click', () => {
    if (v.paused) { vonHand = false; abspielen(); } else { vonHand = true; v.pause(); }
  });
  v.addEventListener('click', () => knopf.click());
  kapitel.forEach((k) => k.addEventListener('click', () => { v.currentTime = Number(k.dataset.zeit); vonHand = false; abspielen(); }));
  zeigen();
  if (ruhig || !('IntersectionObserver' in window)) return;
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { if (!vonHand) abspielen(); } else if (!v.paused) v.pause();
  }, { threshold: 0.5 }).observe(v);
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
