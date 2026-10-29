"""SEO-Dateien der Nextfix-Website erzeugen und prüfen.

Eine Adresse (SITE_URL) steuert alles: sitemap.xml, robots.txt, llms.txt und den
SEO-Block im <head> jeder Seite (Canonical, Open Graph, Twitter, JSON-LD).

    python3 tools/seo_dateien.py          # alles neu schreiben
    python3 tools/seo_dateien.py --check  # nur prüfen, Exit-Code 1 bei Fehlern

Eigene Domain gekauft? SITE_URL ändern, Skript laufen lassen, fertig.
Nur Standardbibliothek, damit es überall läuft.
"""

from __future__ import annotations

import datetime as dt
import html
import json
import re
import subprocess
import sys
from pathlib import Path

SITE_URL = "https://the-neyro.github.io"  # ohne Schrägstrich am Ende
REPO_URL = "https://github.com/the-neyro/nextfix"
NAME = "Nextfix"
# Aktuelle Version des Programms; bei jedem Release mit der Startseite (Hero-Zeile) zusammen anheben
VERSION = "0.2.3"
VERSION_DATUM = "2026-10-28"
# Autor der Beiträge: Pseudonym, wie es der Nutzer gewählt hat (kein Klarname)
AUTOR = {"@type": "Person", "name": "the-neyro", "url": "https://github.com/the-neyro"}
OG_BILD = "assets/img/og.png"
OG_BILD_ALT = "Nextfix: „Was deine Website als Nächstes braucht.“ – mit der nächsten Aufgabe aus der Liste „Was jetzt tun“"
SCREENSHOT = "assets/img/shot-uebersicht-breit-1200.webp"

WURZEL = Path(__file__).resolve().parent.parent

# Reihenfolge = Reihenfolge in Sitemap und llms.txt. 404.html fehlt absichtlich (noindex).
FESTE_SEITEN = [
    {"datei": "index.html", "pfad": "/", "kurz": "Startseite"},
    {"datei": "funktionen/index.html", "pfad": "/funktionen/", "kurz": "Funktionen"},
    {"datei": "pruefungen/index.html", "pfad": "/pruefungen/", "kurz": "Alle Prüfungen"},
    {"datei": "alternative/index.html", "pfad": "/alternative/", "kurz": "Alternative"},
    {"datei": "installation/index.html", "pfad": "/installation/", "kurz": "Installation"},
    {"datei": "faq/index.html", "pfad": "/faq/", "kurz": "FAQ"},
    {"datei": "blog/index.html", "pfad": "/blog/", "kurz": "Blog"},
    {"datei": "datenschutz/index.html", "pfad": "/datenschutz/", "kurz": "Datenschutz"},
]


def blog_seiten() -> list[dict]:
    """Beiträge aus content/blog (Dateiname JJJJ-MM-TT-slug.md), neueste zuerst."""
    liste = []
    for datei in sorted((WURZEL / "content" / "blog").glob("*.md"), reverse=True):
        m = re.match(r"(\d{4}-\d{2}-\d{2})-(.+)\.md$", datei.name)
        if m and (WURZEL / "blog" / m.group(2) / "index.html").exists():
            liste.append({"datei": f"blog/{m.group(2)}/index.html", "pfad": f"/blog/{m.group(2)}/", "kurz": "Blog", "blog": True,
                          "datum": m.group(1)})
    return liste


SEITEN = FESTE_SEITEN + blog_seiten()

START = "<!-- seo:start (erzeugt von tools/seo_dateien.py, nicht von Hand ändern) -->"
ENDE = "<!-- seo:ende -->"
BLOCK_RE = re.compile(r"\n?<!-- seo:start.*?<!-- seo:ende -->", re.S)


# ---------- Lesen ----------

def lesen(datei: str) -> str:
    return (WURZEL / datei).read_text(encoding="utf-8")


def meta(quelltext: str) -> tuple[str, str]:
    """Titel und Beschreibung einer Seite."""
    titel = re.search(r"<title>(.*?)</title>", quelltext, re.S)
    beschr = re.search(r'<meta name="description" content="(.*?)">', quelltext, re.S)
    if not titel or not beschr:
        raise ValueError("Seite ohne <title> oder Beschreibung")
    return html.unescape(titel.group(1).strip()), html.unescape(beschr.group(1).strip())


def text_ohne_tags(fragment: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", fragment))).strip()


def faq_eintraege(quelltext: str) -> list[tuple[str, str]]:
    """Fragen und Antworten aus den <details class="qa"> der Seite."""
    paare = []
    for block in re.findall(r'<details class="qa"[^>]*>(.*?)</details>', quelltext, re.S):
        frage = re.search(r"<summary>(.*?)</summary>", block, re.S)
        antwort = re.search(r'<div class="qa__a">(.*?)</div>', block, re.S)
        if frage and antwort:
            paare.append((text_ohne_tags(frage.group(1)), text_ohne_tags(antwort.group(1))))
    return paare


def geaendert_am(datei: str) -> str:
    """Datum der letzten Änderung laut Git, sonst heute."""
    try:
        aus = subprocess.run(["git", "log", "-1", "--format=%cs", "--", datei], cwd=WURZEL,
                             capture_output=True, text=True, check=True).stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        aus = ""
    return aus or dt.date.today().isoformat()


def url(pfad: str) -> str:
    return SITE_URL + pfad


# ---------- Bauen ----------

def og_bild(seite: dict, titel: str = "") -> tuple[str, str]:
    """Vorschaubild und Alt-Text: Blogbeiträge haben ein eigenes (tools/og_bild.py), sonst das allgemeine."""
    if seite.get("blog"):
        eigenes = f"assets/img/og/{seite['pfad'].strip('/').split('/')[-1]}.png"
        if (WURZEL / eigenes).exists():
            return eigenes, f"Nextfix-Blog: {titel.split(' | ')[0]}"
    return OG_BILD, OG_BILD_ALT


def json_ld(seite: dict, titel: str, beschr: str, quelltext: str) -> list[dict]:
    if seite["pfad"] == "/":
        return [{
            "@context": "https://schema.org",
            "@graph": [
                {"@type": "WebSite", "@id": url("/#website"), "url": url("/"), "name": NAME, "inLanguage": "de",
                 "publisher": {"@id": url("/#autor")}},
                # Wer dahintersteht: Pseudonym wie auf GitHub (sichtbar in FAQ und Fußzeile)
                {**AUTOR, "@id": url("/#autor"), "sameAs": [AUTOR["url"], REPO_URL]},
                {"@type": "SoftwareApplication", "@id": url("/#software"), "name": NAME, "url": url("/"),
                 "description": beschr, "applicationCategory": "BusinessApplication",
                 "applicationSubCategory": "SEO-Tool", "operatingSystem": "macOS, Linux",
                 "softwareVersion": VERSION, "datePublished": VERSION_DATUM,
                 "isAccessibleForFree": True, "license": "https://opensource.org/licenses/MIT",
                 "offers": {"@type": "Offer", "price": "0", "priceCurrency": "EUR"},
                 "installUrl": url("/installation/"), "sameAs": [REPO_URL], "author": {"@id": url("/#autor")},
                 "image": url("/" + OG_BILD), "screenshot": url("/" + SCREENSHOT), "inLanguage": "de"},
            ],
        }]
    kette = [{"@type": "ListItem", "position": 1, "name": NAME, "item": url("/")}]
    if seite.get("blog"):
        kette.append({"@type": "ListItem", "position": 2, "name": "Blog", "item": url("/blog/")})
        kette.append({"@type": "ListItem", "position": 3, "name": titel.split(" | ")[0], "item": url(seite["pfad"])})
    else:
        kette.append({"@type": "ListItem", "position": 2, "name": seite["kurz"], "item": url(seite["pfad"])})
    daten = [{"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": kette}]
    if seite.get("blog"):
        daten.append({
            "@context": "https://schema.org", "@type": "BlogPosting", "headline": titel.split(" | ")[0],
            "description": beschr, "datePublished": seite["datum"], "dateModified": seite["datum"], "inLanguage": "de",
            "mainEntityOfPage": url(seite["pfad"]), "image": url("/" + og_bild(seite)[0]),
            "author": AUTOR,
            "publisher": {"@type": "Organization", "name": NAME, "url": url("/")},
        })
    if seite["pfad"] == "/faq/":
        daten.append({
            "@context": "https://schema.org", "@type": "FAQPage", "inLanguage": "de",
            "mainEntity": [{"@type": "Question", "name": f,
                            "acceptedAnswer": {"@type": "Answer", "text": a}} for f, a in faq_eintraege(quelltext)],
        })
    return daten


def kopf_block(seite: dict, quelltext: str) -> str:
    titel, beschr = meta(quelltext)
    e = lambda s: html.escape(s, quote=True)  # noqa: E731
    zeilen = [
        START,
        f'<link rel="canonical" href="{url(seite["pfad"])}">',
        '<meta name="theme-color" content="#fbf7f8" media="(prefers-color-scheme: light)">',
        '<meta name="theme-color" content="#0e0e0f" media="(prefers-color-scheme: dark)">',
        f'<link rel="apple-touch-icon" href="{url("/assets/img/apple-touch-icon.png")}">',
        f'<meta property="og:type" content="{"article" if seite.get("blog") else "website"}">',
        f'<meta property="og:site_name" content="{NAME}">',
        '<meta property="og:locale" content="de_DE">',
        f'<meta property="og:title" content="{e(titel)}">',
        f'<meta property="og:description" content="{e(beschr)}">',
        f'<meta property="og:url" content="{url(seite["pfad"])}">',
        f'<meta property="og:image" content="{url("/" + og_bild(seite)[0])}">',
        '<meta property="og:image:width" content="1200">',
        '<meta property="og:image:height" content="630">',
        f'<meta property="og:image:alt" content="{e(og_bild(seite, titel)[1])}">',
        '<meta name="twitter:card" content="summary_large_image">',
    ]
    for daten in json_ld(seite, titel, beschr, quelltext):
        # </ im JSON entschärfen, damit kein Text das Skript-Tag schließen kann
        roh = json.dumps(daten, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
        zeilen.append(f'<script type="application/ld+json">{roh}</script>')
    zeilen.append(ENDE)
    return "\n".join(zeilen)


def seite_mit_block(seite: dict) -> str:
    quelltext = BLOCK_RE.sub("", lesen(seite["datei"]))
    anker = re.search(r'<meta name="description" content=".*?">', quelltext, re.S)
    if not anker:
        raise ValueError(f"{seite['datei']}: keine Beschreibung als Anker")
    return quelltext[:anker.end()] + "\n" + kopf_block(seite, quelltext) + quelltext[anker.end():]


def sitemap() -> str:
    eintraege = "".join(
        f"  <url><loc>{url(s['pfad'])}</loc><lastmod>{geaendert_am(s['datei'])}</lastmod></url>\n" for s in SEITEN)
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + eintraege + "</urlset>\n")


def robots() -> str:
    # Alle Crawler willkommen, auch KI-Suchen: die Seite soll gefunden und zitiert werden.
    return f"User-agent: *\nAllow: /\n\nSitemap: {url('/sitemap.xml')}\n"


def llms() -> str:
    start_titel, start_beschr = meta(lesen("index.html"))
    teile = [
        f"# {NAME}\n",
        f"> {start_beschr}\n",
        "Nextfix ist ein kostenloses, quelloffenes SEO-Tool (MIT-Lizenz), das lokal auf dem eigenen Rechner läuft. "
        "Es crawlt eine Website, bewertet 111 Prüfungen in acht Bereichen zu einem Website-Zustand von 0 bis 100 und "
        "macht daraus die Liste „Was jetzt tun“: Aufgaben in der Reihenfolge ihrer Wirkung, mit Begründung, Anleitung "
        "und dem Hinweis, wer sie erledigt. Dazu Ladezeit im Labor (LCP, CLS, TBT), Positionen aus Google Search Console "
        "und Bing, Suchbegriffe, Seite optimieren und KI-Sichtbarkeit. Keine bezahlten Schnittstellen, kein Konto, "
        "kein Tracking. Claude kann Nextfix über 51 MCP-Werkzeuge bedienen. Die Website ist auf Deutsch.\n",
        f"Aktuelle Version: {VERSION} vom {dt.date.fromisoformat(VERSION_DATUM):%d.%m.%Y}. Läuft auf macOS und Linux; Windows "
        "funktioniert, ist aber noch nicht offiziell unterstützt. Installation: eine Zeile im Terminal, sie holt die neueste "
        f"veröffentlichte Version ({REPO_URL}/releases).\n",
        "## Seiten\n",
    ]
    for s in FESTE_SEITEN:
        if s["pfad"] == "/datenschutz/":
            continue
        titel, beschr = meta(lesen(s["datei"]))
        teile.append(f"- [{titel}]({url(s['pfad'])}): {beschr}")
    beitraege = [s for s in SEITEN if s.get("blog")]
    if beitraege:
        teile.append("\n## Blog\n")
        for s in beitraege:
            titel, beschr = meta(lesen(s["datei"]))
            teile.append(f"- [{titel}]({url(s['pfad'])}): {beschr}")
    teile += ["\n## Quellcode\n", f"- [{NAME} auf GitHub]({REPO_URL}): Quellcode, README und Lizenz",
              "\n## Optional\n", f"- [Datenschutzerklärung]({url('/datenschutz/')})"]
    return "\n".join(teile) + "\n"


def soll_dateien() -> dict[str, str]:
    dateien = {s["datei"]: seite_mit_block(s) for s in SEITEN}
    dateien["sitemap.xml"] = sitemap()
    dateien["robots.txt"] = robots()
    dateien["llms.txt"] = llms()
    return dateien


# ---------- Prüfen ----------

def pruefen(dateien: dict[str, str]) -> list[str]:
    fehler = []
    for name, inhalt in dateien.items():
        pfad = WURZEL / name
        if not pfad.exists() or pfad.read_text(encoding="utf-8") != inhalt:
            fehler.append(f"{name}: veraltet, Skript ohne --check laufen lassen")
    for s in SEITEN:
        quelltext = dateien[s["datei"]]
        titel, beschr = meta(quelltext)
        if len(titel) > 70:
            fehler.append(f"{s['datei']}: Titel {len(titel)} Zeichen (max. 70)")
        if not 70 <= len(beschr) <= 160:
            fehler.append(f"{s['datei']}: Beschreibung {len(beschr)} Zeichen (70–160)")
        for roh in re.findall(r'<script type="application/ld\+json">(.*?)</script>', quelltext, re.S):
            try:
                json.loads(roh)
            except json.JSONDecodeError as err:
                fehler.append(f"{s['datei']}: JSON-LD kaputt ({err})")
        if quelltext.count('rel="canonical"') != 1:
            fehler.append(f"{s['datei']}: nicht genau ein Canonical")
    if not faq_eintraege(dateien["faq/index.html"]):
        fehler.append("faq/index.html: keine Fragen gefunden")
    for bild in (OG_BILD, "assets/img/apple-touch-icon.png", SCREENSHOT):
        if not (WURZEL / bild).exists():
            fehler.append(f"{bild} fehlt")
    return fehler


def main() -> int:
    dateien = soll_dateien()
    if "--check" not in sys.argv:
        for name, inhalt in dateien.items():
            (WURZEL / name).write_text(inhalt, encoding="utf-8")
    fehler = pruefen(dateien)
    for f in fehler:
        print("FEHLER:", f)
    print("OK" if not fehler else f"{len(fehler)} Fehler")
    return 1 if fehler else 0


if __name__ == "__main__":
    sys.exit(main())
