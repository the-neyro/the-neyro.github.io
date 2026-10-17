"""Blog und Prüfungs-Katalog der Nextfix-Website erzeugen.

    python3 tools/inhalte.py

- Blog: jede Datei `content/blog/JJJJ-MM-TT-slug.md` wird zu `/blog/slug/`. Dazu die Liste `/blog/`,
  der Atom-Feed `/blog/feed.xml` und der Block „Neu im Blog“ auf der Startseite (zwischen den
  Markierungen `<!-- blog:start -->` und `<!-- blog:ende -->`).
- Katalog: `content/pruefungen.json` (aus dem Nextfix-Register exportiert) wird zu `/pruefungen/`.

Kopf einer Blog-Datei (erste Zeilen bis zur Leerzeile):
    titel: Überschrift des Beitrags
    beschreibung: ein Satz für Liste, Feed und Suchmaschinen (70–160 Zeichen)
    uhrzeit: 14:30   (optional, ordnet Beiträge vom selben Tag)

Danach Markdown in einfacher Form: ## / ### Überschriften, Absätze, Listen mit - oder 1.,
**fett**, *kursiv*, `Code`, [Text](Adresse) und ```-Codeblöcke. Nur Standardbibliothek.
Danach `python3 tools/seo_dateien.py` laufen lassen (Sitemap, Canonicals, JSON-LD).
"""

from __future__ import annotations

import datetime as dt
import html
import json
import re
from pathlib import Path

WURZEL = Path(__file__).resolve().parent.parent
SITE_URL = "https://the-neyro.github.io"
BLOG_QUELLE = WURZEL / "content" / "blog"
MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"]
STUFE = {"error": ("Dringend", "dringend"), "warning": ("Wichtig", "wichtig"), "notice": ("Feinschliff", "fein")}
BEREICH_TEXT = {
    "crawlbarkeit": "Ob Suchmaschinen deine Seiten finden und abrufen können.",
    "https": "Ob die Verbindung sicher ist und das Zertifikat stimmt.",
    "links": "Wie deine Seiten untereinander verlinkt sind.",
    "inhalt": "Titel, Beschreibungen, Überschriften, Texte und Bilder.",
    "performance": "Wie schnell und stabil deine Seiten laden.",
    "technik": "Technische Grundlagen und strukturierte Daten.",
    "international": "Sprachangaben für Websites in mehreren Sprachen.",
    "ki": "Ob KI-Suchdienste deine Inhalte lesen und zitieren können.",
}
BEREICHE = {"crawlbarkeit": "Crawlbarkeit", "https": "HTTPS", "links": "Interne Verlinkung", "inhalt": "Inhalt & Meta",
            "performance": "Performance", "technik": "Technik & Markup", "international": "Internationales SEO", "ki": "KI-Suche"}

e = lambda s: html.escape(s, quote=True)  # noqa: E731


# ---------- Rahmen jeder Seite ----------

def seite(tiefe: int, titel: str, beschreibung: str, inhalt: str, aktiv: str = "") -> str:
    p = "../" * tiefe
    nav = lambda ziel, text, extra="": (  # noqa: E731
        f'<a{extra} href="{p}{ziel}"' + (' aria-current="page"' if ziel == aktiv else "") + f">{text}</a>")
    return f"""<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(titel)}</title>
<meta name="description" content="{e(beschreibung)}">
<link rel="icon" href="{p}favicon.svg" type="image/svg+xml">
<link rel="alternate" type="application/atom+xml" title="Nextfix-Blog" href="{p}blog/feed.xml">
<link rel="preload" href="{p}assets/fonts/fira-sans-condensed-latin-500-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="{p}assets/css/site.css">
<script>/* Einblenden nur, wenn site.js wirklich läuft; sonst nach 2,5 s alles sichtbar */document.documentElement.classList.add('js');setTimeout(function(){{if(!window.nextfixOk)document.documentElement.classList.remove('js')}},2500)</script>
</head>
<body>
<a class="skip" href="#inhalt">Zum Inhalt</a>

<header class="site-head">
  <a class="wordmark" href="{p}" aria-label="Nextfix, Startseite">Nextfix</a>
  <nav class="site-nav" aria-label="Hauptmenü">
    {nav("funktionen/", "Funktionen")}
    {nav("faq/", "FAQ")}
    {nav("blog/", "Blog", ' class="nav-wide"')}
    <a class="nav-wide" href="https://github.com/the-neyro/nextfix">GitHub</a>
    <a class="button button--small" href="{p}installation/">Installieren</a>
  </nav>
</header>

<main id="inhalt">
{inhalt}
</main>

<footer class="site-foot site-foot--short">
  <div class="foot-top">
    <div class="foot-invite">
      <h2>Fang mit der ersten Aufgabe an.</h2>
      <a class="button button--light" href="{p}installation/">Installieren</a>
    </div>
    <nav class="foot-links" aria-label="Fußmenü">
      <a href="https://github.com/the-neyro/nextfix">Quellcode auf GitHub</a>
      <a href="{p}funktionen/">Funktionen</a>
      <a href="{p}pruefungen/">Alle Prüfungen</a>
      <a href="{p}installation/">Installation</a>
      <a href="{p}faq/">FAQ</a>
      <a href="{p}blog/">Blog</a>
    </nav>
  </div>
  <div class="foot-legal">
    <span>Nextfix ist kostenlos und quelloffen (MIT-Lizenz). Screenshots zeigen die erfundene Demo-Website „Radhaus Elbe“.</span>
    <a href="{p}datenschutz/">Datenschutz</a>
  </div>
  <p class="foot-name" aria-hidden="true">Nextfix</p>
</footer>

<script src="{p}assets/js/site.js" defer></script>
</body>
</html>
"""


# ---------- Markdown (bewusst klein) ----------

def inline(text: str) -> str:
    text = e(text)
    text = re.sub(r"`([^`]+)`", r"<code>\1</code>", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"(?<![*\w])\*([^*]+)\*(?!\w)", r"<em>\1</em>", text)
    return re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", r'<a href="\2">\1</a>', text)


def markdown(quelle: str) -> str:
    teile, absatz, liste, code = [], [], None, None
    def absatz_ende():
        if absatz:
            teile.append(f"<p>{inline(' '.join(absatz))}</p>"); absatz.clear()
    def liste_ende():
        nonlocal liste
        if liste:
            art, punkte = liste
            teile.append(f"<{art}>" + "".join(f"<li>{inline(x)}</li>" for x in punkte) + f"</{art}>"); liste = None
    for zeile in quelle.splitlines():
        if code is not None:
            if zeile.strip().startswith("```"):
                teile.append(f'<div class="code"><pre><code>{e(chr(10).join(code))}</code></pre><button class="code__copy" type="button" hidden>Kopieren</button></div>')
                code = None
            else:
                code.append(zeile)
            continue
        z = zeile.rstrip()
        if z.strip().startswith("```"):
            absatz_ende(); liste_ende(); code = []
        elif not z.strip():
            absatz_ende(); liste_ende()
        elif m := re.match(r"^(#{2,3})\s+(.*)", z):
            absatz_ende(); liste_ende()
            teile.append(f"<h{len(m.group(1))}>{inline(m.group(2))}</h{len(m.group(1))}>")
        elif m := re.match(r"^\s*(?:-|\d+\.)\s+(.*)", z):
            absatz_ende()
            art = "ol" if re.match(r"^\s*\d+\.", z) else "ul"
            if not liste or liste[0] != art:
                liste_ende(); liste = (art, [])
            liste[1].append(m.group(1))
        else:
            liste_ende(); absatz.append(z.strip())
    absatz_ende(); liste_ende()
    return "\n".join(teile)


# ---------- Blog ----------

def datum_lang(d: dt.date) -> str:
    return f"{d.day}. {MONATE[d.month - 1]} {d.year}"


def beitraege() -> list[dict]:
    liste = []
    for datei in sorted(BLOG_QUELLE.glob("*.md"), reverse=True):
        m = re.match(r"(\d{4}-\d{2}-\d{2})-(.+)\.md$", datei.name)
        if not m:
            raise ValueError(f"Dateiname muss JJJJ-MM-TT-slug.md sein: {datei.name}")
        kopf, _, rumpf = datei.read_text(encoding="utf-8").partition("\n\n")
        meta = dict(z.split(":", 1) for z in kopf.splitlines() if ":" in z)
        meta = {k.strip(): v.strip() for k, v in meta.items()}
        for pflicht in ("titel", "beschreibung"):
            if pflicht not in meta:
                raise ValueError(f"{datei.name}: Kopfzeile '{pflicht}:' fehlt")
        liste.append({"datum": dt.date.fromisoformat(m.group(1)), "zeit": meta.get("uhrzeit", "09:00"), "slug": m.group(2), "titel": meta["titel"],
                      "beschreibung": meta["beschreibung"], "html": markdown(rumpf), "datei": datei.name})
    return sorted(liste, key=lambda b: (b["datum"], b["zeit"]), reverse=True)


def karte(b: dict, praefix: str) -> str:
    return (f'<a class="post-card" href="{praefix}{b["slug"]}/"><time datetime="{b["datum"]}">{datum_lang(b["datum"])}</time>'
            f'<h3>{e(b["titel"])}</h3><p>{e(b["beschreibung"])}</p></a>')


def blog_bauen(alle: list[dict]) -> dict[str, str]:
    dateien = {}
    for i, b in enumerate(alle):
        nachbar = []
        if i + 1 < len(alle):
            nachbar.append(f'<a class="link" href="../{alle[i + 1]["slug"]}/">← {e(alle[i + 1]["titel"])}</a>')
        if i > 0:
            nachbar.append(f'<a class="link" href="../{alle[i - 1]["slug"]}/">{e(alle[i - 1]["titel"])} →</a>')
        inhalt = f"""  <article class="post">
    <header class="page-head post__head">
      <p class="post__date"><a class="link" href="../">Blog</a> · <time datetime="{b["datum"]}">{datum_lang(b["datum"])}</time></p>
      <h1>{e(b["titel"])}</h1>
      <p class="statement">{e(b["beschreibung"])}</p>
    </header>
    <div class="prose post__body">
{b["html"]}
    </div>
    <nav class="prose post__nav" aria-label="Weitere Beiträge">{" ".join(nachbar)}</nav>
  </article>"""
        dateien[f"blog/{b['slug']}/index.html"] = seite(2, f"{b['titel']} | Nextfix-Blog", b["beschreibung"], inhalt, "blog/")
    liste = "\n".join(f"    {karte(b, '')}" for b in alle)
    dateien["blog/index.html"] = seite(1, "Blog: Neues aus der Entwicklung von Nextfix", "Was sich an Nextfix geändert hat und warum: neue Prüfungen, Funktionen und Entscheidungen, kurz und ehrlich erklärt.", f"""  <div class="page-head">
    <h1 data-reveal>Blog</h1>
    <p class="statement" data-reveal style="--i:1">Was sich an Nextfix ändert und warum. Kurz, ehrlich, ohne Werbesprech.</p>
    <p class="post__feed" data-reveal style="--i:2"><a class="link" href="feed.xml">Per Feed abonnieren (Atom)</a></p>
  </div>
  <section class="section wrap" aria-label="Alle Beiträge">
    <div class="posts posts--all">
{liste}
    </div>
  </section>""", "blog/")
    dateien["blog/feed.xml"] = feed(alle)
    return dateien


def feed(alle: list[dict]) -> str:
    def iso(d: dt.date, zeit: str = "09:00") -> str:
        return f"{d.isoformat()}T{zeit}:00Z"
    eintraege = "".join(f"""
  <entry>
    <title>{e(b["titel"])}</title>
    <link href="{SITE_URL}/blog/{b["slug"]}/"/>
    <id>{SITE_URL}/blog/{b["slug"]}/</id>
    <updated>{iso(b["datum"], b["zeit"])}</updated>
    <summary>{e(b["beschreibung"])}</summary>
    <content type="html">{e(b["html"])}</content>
  </entry>""" for b in alle)
    neuestes = iso(alle[0]["datum"], alle[0]["zeit"]) if alle else iso(dt.date.today())
    return f"""<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="de">
  <title>Nextfix-Blog</title>
  <subtitle>Neues aus der Entwicklung von Nextfix, dem kostenlosen SEO-Tool für deinen Rechner.</subtitle>
  <link href="{SITE_URL}/blog/"/>
  <link rel="self" href="{SITE_URL}/blog/feed.xml"/>
  <id>{SITE_URL}/blog/</id>
  <updated>{neuestes}</updated>
  <author><name>Nextfix</name></author>{eintraege}
</feed>
"""


def startseite_teaser(alle: list[dict]) -> str:
    quelle = (WURZEL / "index.html").read_text(encoding="utf-8")
    block = "<!-- blog:start -->\n  <div class=\"posts\">\n" + "\n".join(f"    {karte(b, 'blog/')}" for b in alle[:3]) + "\n  </div>\n  <!-- blog:ende -->"
    neu, n = re.subn(r"<!-- blog:start -->.*?<!-- blog:ende -->", block, quelle, flags=re.S)
    if n != 1:
        raise ValueError("Startseite: Markierungen blog:start/blog:ende fehlen")
    return neu


# ---------- Katalog der Prüfungen ----------

def katalog_bauen() -> str:
    daten = json.loads((WURZEL / "content" / "pruefungen.json").read_text(encoding="utf-8"))
    gruppen: dict[str, list[dict]] = {}
    for c in daten:
        gruppen.setdefault(c["kategorie"], []).append(c)
    reihenfolge = sorted(gruppen, key=lambda k: -len(gruppen[k]))
    sprung = "".join(f'<li><a href="#{k}">{BEREICHE[k]} <span>{len(gruppen[k])}</span></a></li>' for k in reihenfolge)
    abschnitte = []
    rang = {"error": 0, "warning": 1, "notice": 2}
    # Prüfungen, die bei der Demo-Website anschlagen, zeigen auf ihre Fundstellen in /demo/
    demo: dict[str, list[str]] = {}
    for f in json.loads((WURZEL / "content" / "demo-fundstellen.json").read_text(encoding="utf-8")):
        demo.setdefault(f["check"], []).append(f["pfad"])

    def demo_hinweis(cid: str) -> str:
        if cid not in demo:
            return ""
        pfade = demo[cid]
        wo = "die ganze Website" if pfade == ["(ganze Website)"] else ("1 Seite" if len(pfade) == 1 else f"{len(pfade)} Seiten")
        ziel = f"../demo/crawls-2-issues-{cid.replace('_', '-')}-seite.html"
        return f'<p><strong>In der Demo:</strong> betrifft bei „Radhaus Elbe“ {wo}. <a class="link" href="{ziel}">So sieht das in Nextfix aus</a></p>'

    for k in reihenfolge:
        punkte = []
        for c in sorted(gruppen[k], key=lambda c: (rang[c["schwere"]], c["name"])):
            stufe, klasse = STUFE[c["schwere"]]
            punkte.append(f"""        <details class="qa pruefung" id="p-{e(c["id"])}">
          <summary><span class="pruefung__name">{e(c["name"])}</span><span class="tag tag--{klasse}">{stufe}</span></summary>
          <div class="qa__a"><p><strong>Warum das zählt:</strong> {e(c["warum"])}</p><p><strong>So behebst du es:</strong> {e(c["beheben"])}</p>{demo_hinweis(c["id"])}</div>
        </details>""")
        abschnitte.append(f"""    <section class="katalog__gruppe" id="{k}" aria-labelledby="h-{k}">
      <div class="katalog__kopf"><h2 id="h-{k}" class="h2">{BEREICHE[k]}</h2><p>{BEREICH_TEXT[k]} {len(gruppen[k])} Prüfungen.</p></div>
      <div class="katalog__liste">
{chr(10).join(punkte)}
      </div>
    </section>""")
    zaehl = {s: sum(1 for c in daten if c["schwere"] == s) for s in rang}
    inhalt = f"""  <div class="page-head">
    <h1 data-reveal>Alle {len(daten)} Prüfungen</h1>
    <p class="statement" data-reveal style="--i:1">Was Nextfix auf jeder Seite deiner Website prüft, warum es zählt und wie du es behebst.</p>
    <p class="katalog__summe" data-reveal style="--i:2"><span class="tag tag--dringend">Dringend</span> {zaehl["error"]} · <span class="tag tag--wichtig">Wichtig</span> {zaehl["warning"]} · <span class="tag tag--fein">Feinschliff</span> {zaehl["notice"]}</p>
  </div>
  <div class="wrap katalog">
    <nav class="katalog__nav" aria-label="Bereiche"><ul>{sprung}</ul></nav>
    <div class="katalog__inhalt">
{chr(10).join(abschnitte)}
    </div>
  </div>"""
    return seite(1, f"Alle {len(daten)} SEO-Prüfungen von Nextfix, mit Anleitung", f"Die {len(daten)} Prüfungen des kostenlosen SEO-Tools Nextfix: von kaputten Links bis KI-Suche, je mit Begründung und Anleitung zum Beheben.", inhalt, "pruefungen/")


def main() -> None:
    alle = beitraege()
    dateien = blog_bauen(alle)
    dateien["pruefungen/index.html"] = katalog_bauen()
    dateien["index.html"] = startseite_teaser(alle)
    for name, inhalt in dateien.items():
        ziel = WURZEL / name
        ziel.parent.mkdir(parents=True, exist_ok=True)
        ziel.write_text(inhalt, encoding="utf-8")
    print(f"{len(alle)} Beiträge, Katalog, Startseite aktualisiert")


if __name__ == "__main__":
    main()
