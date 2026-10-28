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

// Diagramm „43 Fundstellen → 8 Aufgaben → eine zuerst“: ein Quadrat je echter Fundstelle der Demo-Prüfung.
// Links verstreut, in der Mitte zu einem Band gebündelt, rechts in Aufgaben geordnet (die erste hervorgehoben).
(() => {
  const figur = document.querySelector('[data-diagram]');
  if (!figur) return;
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
  const anzahl = AUFGABEN.map((a) => FUNDE[a.check].length);
  anzahl.push(Object.keys(FEIN).reduce((n, k) => n + FUNDE[k].length, 0)); // Feinschliff
  const gesamt = anzahl.reduce((n, k) => n + k, 0);
  let seed = 7;
  const zufall = () => (seed = (seed * 16807) % 2147483647) / 2147483647; // fester Samen: das Bild sieht bei jedem Laden gleich aus
  const rect = (x, y, s, klasse) => `<rect class="${klasse}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${s}" height="${s}"/>`;
  function bauen(hoch) {
    const s = 16, p = 24, B = hoch ? 600 : 1200, H = hoch ? 800 : 280, pro = 14; // pro: Quadrate je Zeile rechts
    const zone = hoch ? H / 3 : B / 3;
    let a = '', m = '', r = '';
    for (let i = 0; i < gesamt; i++) { // verstreut, in zwei hellen Tönen
      const x = hoch ? 20 + zufall() * (B - 60) : 20 + zufall() * (zone - 60);
      const y = hoch ? 20 + zufall() * (zone - 60) : 20 + zufall() * (H - 60);
      a += rect(x, y, s, i % 3 ? 'dg-a' : 'dg-b');
    }
    const spalten = Math.ceil(gesamt / 3);
    for (let i = 0; i < gesamt; i++) { // Band, drei Quadrate hoch bzw. breit
      const u = Math.floor(i / 3), v = i % 3;
      const bandLang = spalten * p, bandBreit = 3 * p;
      const x = hoch ? (B - bandBreit) / 2 + v * p : zone + (zone - bandLang) / 2 + u * p;
      const y = hoch ? zone + (zone - bandLang) / 2 + u * p : (H - bandBreit) / 2 + v * p;
      m += rect(x, y, s, 'dg-m');
    }
    let zeile = 0;
    anzahl.forEach((n, g) => { // geordnete Zeilen: eine je Aufgabe, zuletzt der Feinschliff (bricht nach 14 um)
      for (let i = 0; i < n; i++) {
        if (i && i % pro === 0) zeile++;
        const klasse = g === 0 ? 'dg-first' : g === anzahl.length - 1 ? 'dg-p' : 'dg-m';
        const x = (hoch ? 40 : 2 * zone + 40) + (i % pro) * p;
        const y = (hoch ? 2 * zone + 20 : 8) + zeile * 26;
        r += rect(x, y, s, klasse);
      }
      zeile++;
    });
    return `<svg viewBox="0 0 ${B} ${H}" aria-hidden="true" focusable="false"><g class="dg-grp">${a}</g><g class="dg-grp">${m}</g><g class="dg-grp">${r}</g></svg>`;
  }
  const mq = window.matchMedia('(max-width: 50em)');
  const zeichne = () => { figur.innerHTML = bauen(mq.matches); };
  zeichne();
  mq.addEventListener('change', zeichne);
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { figur.classList.add('is-in'); io.disconnect(); } }, { threshold: 0.25 });
    io.observe(figur);
  } else figur.classList.add('is-in');
})();

// Showcase: nur die Tafel in der Mitte leuchtet; Name und Text darunter wechseln mit ihr. Mit der Maus ziehbar.
(() => {
  const reihe = document.querySelector('[data-showcase]');
  if (!reihe) return;
  const tafeln = [...reihe.querySelectorAll('[data-sp]')];
  const name = document.querySelector('[data-show-name]'), text = document.querySelector('[data-show-text]');
  let aktiv = -1;
  const pruefen = () => {
    const mitte = reihe.scrollLeft + reihe.clientWidth / 2;
    let best = 0, abstand = Infinity;
    tafeln.forEach((t, i) => { const d = Math.abs(t.offsetLeft + t.offsetWidth / 2 - mitte); if (d < abstand) { abstand = d; best = i; } });
    if (best === aktiv) return;
    aktiv = best;
    tafeln.forEach((t, i) => { t.classList.toggle('is-center', i === best); t.toggleAttribute('inert', i !== best); });
    name.textContent = tafeln[best].dataset.name; text.textContent = tafeln[best].dataset.text;
  };
  let wartet = false;
  reihe.addEventListener('scroll', () => { if (!wartet) { wartet = true; requestAnimationFrame(() => { wartet = false; pruefen(); }); } }, { passive: true });
  window.addEventListener('resize', pruefen);
  // Ziehen mit der Maus (Touch scrollt von selbst)
  let startX = 0, startLinks = 0, zieht = false;
  reihe.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; zieht = true; startX = e.clientX; startLinks = reihe.scrollLeft; reihe.classList.add('is-drag'); });
  window.addEventListener('pointermove', (e) => { if (zieht) reihe.scrollLeft = startLinks - (e.clientX - startX); });
  window.addEventListener('pointerup', () => { if (!zieht) return; zieht = false; reihe.classList.remove('is-drag'); });
  const ersteMitte = () => { reihe.scrollLeft = 0; pruefen(); };
  ersteMitte();
})();

// Funktionen: Befehlsliste. Tippen filtert, Pfeiltasten und Antippen wählen, die gewählte Zeile klappt auf.
(() => {
  const wurzel = document.querySelector('[data-cmd-list]');
  if (!wurzel) return;
  const eingabe = wurzel.querySelector('.cmd__input');
  const zeilen = [...wurzel.querySelectorAll('.cmd__row')];
  const leer = wurzel.querySelector('.cmd__empty');
  const waehle = (z) => zeilen.forEach((r) => {
    const an = r === z; r.classList.toggle('is-selected', an);
    r.querySelector('.cmd__name').setAttribute('aria-expanded', String(an));
  });
  const sichtbar = () => zeilen.filter((r) => !r.hidden);
  zeilen.forEach((r) => {
    const knopf = r.querySelector('.cmd__name');
    knopf.addEventListener('click', () => waehle(r));
    r.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') waehle(r); });
  });
  eingabe.addEventListener('input', () => {
    const q = eingabe.value.trim().toLowerCase();
    zeilen.forEach((r) => { r.hidden = q && !(r.dataset.cmd + ' ' + r.textContent.toLowerCase()).includes(q); });
    const s = sichtbar();
    leer.hidden = s.length > 0;
    if (s.length && !s.some((r) => r.classList.contains('is-selected'))) waehle(s[0]);
  });
  wurzel.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const s = sichtbar(); if (!s.length) return;
    e.preventDefault();
    const i = Math.max(0, s.findIndex((r) => r.classList.contains('is-selected')));
    const n = s[(i + (e.key === 'ArrowDown' ? 1 : s.length - 1)) % s.length];
    waehle(n); n.querySelector('.cmd__name').focus();
  });
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
