// Nextfix-Website: das bisschen Skript, das die Seite braucht.
// Ohne JavaScript bleibt alles lesbar; jede Funktion prüft, ob ihr Element existiert.

window.nextfixOk = true; // Gegenstück zum Sicherheitsnetz im <head>
const ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

// So läuft es: das Fragment der App wechselt mit dem Text links den Zustand (64 / 8 Aufgaben → 91 / 3 Aufgaben).
// Ohne JavaScript bleibt Zustand 1 stehen und der Text daneben ist ganz lesbar.
(() => {
  const buehne = document.querySelector('[data-stage]');
  if (!buehne) return;
  const schritte = [...document.querySelectorAll('[data-step]')];
  const zeilen = [...buehne.querySelectorAll('[data-r]')];
  const LEAD = [0, 0, 1, 6]; // je Zustand: welche Aufgabe die große ist
  const handy = window.matchMedia('(max-width: 50em)');
  let zustand = 0;
  const setze = (z) => {
    if (z === zustand) return;
    zustand = z;
    buehne.dataset.state = String(z);
    zeilen.forEach((r) => {
      const n = Number(r.dataset.r);
      r.classList.toggle('is-lead', n === LEAD[z]);
      r.classList.toggle('is-weg', z === 3 && n <= 5);
    });
    schritte.forEach((s, i) => s.classList.toggle('is-active', i === z - 1));
  };
  let wartet = false;
  const pruefen = () => {
    wartet = false;
    // Am Handy klebt die Bühne oben: gemessen wird in der Mitte des Rests darunter
    const y = handy.matches ? (buehne.getBoundingClientRect().bottom + innerHeight) / 2 : innerHeight / 2;
    let best = 0, abstand = Infinity;
    schritte.forEach((s, i) => { const r = s.getBoundingClientRect(); const d = Math.abs((r.top + r.bottom) / 2 - y); if (d < abstand) { abstand = d; best = i; } });
    setze(best + 1);
  };
  const plane = () => { if (!wartet) { wartet = true; requestAnimationFrame(pruefen); } };
  window.addEventListener('scroll', plane, { passive: true });
  window.addEventListener('resize', plane);
  pruefen();
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
  // Desktop: Start bei der zweiten Tafel, damit links keine leere Fläche steht (die erste ist angeschnitten sichtbar)
  const ersteMitte = () => {
    const t = tafeln[window.innerWidth > 896 && tafeln.length > 1 ? 1 : 0];
    reihe.scrollLeft = t.offsetLeft + t.offsetWidth / 2 - reihe.clientWidth / 2;
    pruefen();
  };
  ersteMitte();
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
