"""Die klickbare Demo unter /demo/ aus einer laufenden Nextfix-Demo exportieren (nur Standardbibliothek).

Ablauf bei einem neuen Release:
1. Im Nextfix-Repo (Release-Stand): `python -m scripts.screenshots` baut data/demo.db („Radhaus Elbe“).
2. Die Web-UI auf die Demo-Datenbank starten (Kopie nehmen, die App schreibt hinein):
   SEO_DB=/pfad/zur/kopie.db /pfad/zu/nextfix/.venv/bin/python -m uvicorn app.web:app --port 8012
3. python3 tools/demo_export.py [http://127.0.0.1:8012]
   Das Skript folgt allen internen Links, schreibt die Seiten nach demo/ und sperrt alle Formulare.

Was aus der Live-Seite wird: relative statische Dateien, kein htmx, Formulare und Knöpfe gesperrt, lokale
Crawl-Adressen als erfundene Domain, noindex, Hinweisband oben. Alte Seiten in demo/ werden vorher gelöscht
(*.html, bericht.pdf); static/ und demo-mobil.css bleiben (Handarbeit, nicht Teil der App).
"""

from __future__ import annotations

import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

WURZEL = Path(__file__).resolve().parent.parent
ZIEL = WURZEL / "demo"
DEMO_DOMAIN = "https://radhaus-elbe.de"
GESPERRT = "In der Demo gesperrt"
BAND = ('<div class="demo-band" role="note">Demo mit der erfundenen Website <strong>Radhaus Elbe</strong> · '
        'So sieht Nextfix auf deinem Rechner aus · <a href="../">zurück zur Website</a></div>'
        '<div id="demo-toast" role="status" aria-live="polite"></div>')
HEAD_EXTRA = ('<link rel="stylesheet" href="static/demo.css"><meta name="robots" content="noindex">'
              '<link rel="stylesheet" href="demo-mobil.css">')


def dateiname(pfad: str, query: str = "") -> str:
    """Live-Pfad → Dateiname in demo/ (z. B. /crawls/2/issues/wenig_text/seite → crawls-2-issues-wenig-text-seite.html)."""
    if pfad == "/":
        return "projekte.html"
    if re.fullmatch(r"/projekte/\d+", pfad):
        return "index.html"
    if pfad.endswith("/seite") and pfad.startswith("/crawls/") and pfad.count("/") == 3:  # Seiten-Detail: ?url=…
        url = urllib.parse.parse_qs(query).get("url", [""])[0]
        slug = urllib.parse.urlparse(url).path.strip("/").replace("/", "-") or "start"
        return f"seite-{slug}.html"
    return pfad.strip("/").replace("/", "-").replace("_", "-") + ".html"


def ziel_von(href: str) -> str | None:
    """Interner Live-Link → Dateiname, sonst None (extern, Anker, API)."""
    if not href.startswith("/") or href.startswith(("/static/", "/api/")) or ".csv" in href:
        return None
    u = urllib.parse.urlparse(href)
    name = dateiname(u.path, u.query)
    return name + (f"#{u.fragment}" if u.fragment else "")


def umschreiben(html: str, port_re: re.Pattern) -> str:
    html = re.sub(r"<title>", "<title>Demo · ", html, count=1)
    html = re.sub(r'\s*<script src="/static/htmx[^>]*></script>(\s*<!--.*?-->)?', "", html)
    html = html.replace("</head>", HEAD_EXTRA + "\n</head>", 1)
    html = html.replace("<body>", "<body>" + BAND, 1)
    html = html.replace('"/static/', '"static/')
    # API-Links: der Bericht ist als PDF dabei, alles andere gesperrt
    html = re.sub(r'href="/api/[^"]*bericht\.pdf"', 'href="bericht.pdf"', html)
    html = re.sub(r'<a([^>]*?)class="([^"]*)"([^>]*?)href="(?:/api/|/[^"]*\.csv)[^"]*"([^>]*)>(.*?)</a>',
                  r'<span class="\2 demo-aus" title="In der Demo nicht enthalten">\5</span>', html, flags=re.S)
    html = re.sub(r'<a([^>]*?)href="(?:/api/|/[^"]*\.csv)[^"]*"([^>]*)>(.*?)</a>',
                  r'<span class="knopf zweit demo-aus" title="In der Demo nicht enthalten">\3</span>', html, flags=re.S)
    html = re.sub(r'href="(/[^"]*)"', lambda m: f'href="{ziel_von(m.group(1)) or m.group(1)}"', html)
    # Formulare: nichts wird abgeschickt, Felder und Knöpfe sind gesperrt
    html = re.sub(r'\s(hx-[a-z-]+|action|method)="[^"]*"', "", html)
    html = re.sub(r"<form\b", '<form onsubmit="return false"', html)
    html = re.sub(r"<(select|textarea|input)\b(?![^>]*type=\"hidden\")([^>]*)>",
                  lambda m: f'<{m.group(1)} title="{GESPERRT}" disabled{m.group(2)}>', html)
    html = re.sub(r'<button\b(?![^>]*type="button")([^>]*)>',
                  lambda m: f'<button title="{GESPERRT}" aria-disabled="true" class="demo-gesperrt"{m.group(1)}>', html)
    html = re.sub(r"<form\b.*?</form>", lambda m: m.group(0)[:-7] + f'<p class="demo-hinweis">{GESPERRT}</p></form>'
                  if "<select" in m.group(0) else m.group(0), html, flags=re.S)
    # Beispielzahlen aus Search Console gibt es in der Demo nicht
    html = re.sub(r'\s*<span class="klein">Keine Impressionen bei Google in 28 Tagen</span>', "", html)
    html = re.sub(r", bei gleicher Wirkung nach Klicks bei Google \([^)]*\)", "", html)
    # lokale Crawl-Adressen (auch URL-kodiert) → erfundene Domain
    html = port_re.sub(DEMO_DOMAIN, html)
    html = re.sub(r"http%3A//127\.0\.0\.1%3A\d+", urllib.parse.quote(DEMO_DOMAIN, safe="/"), html)
    return html


def holen(basis: str, pfad: str) -> bytes:
    with urllib.request.urlopen(basis + pfad, timeout=60) as r:
        return r.read()


def main() -> None:
    basis = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8012").rstrip("/")
    port_re = re.compile(r"https?://127\.0\.0\.1:\d+")
    for alt in ZIEL.glob("*.html"):
        alt.unlink()
    (ZIEL / "bericht.pdf").unlink(missing_ok=True)
    offen, gesehen = ["/"], {"/"}
    while offen:
        pfad = offen.pop()
        u = urllib.parse.urlparse(pfad)
        html = holen(basis, pfad).decode("utf-8")
        (ZIEL / dateiname(u.path, u.query)).write_text(umschreiben(html, port_re), encoding="utf-8")
        for href in re.findall(r'href="(/[^"#]*)', html):
            if ziel_von(href) and href not in gesehen and not href.startswith("/static/"):
                # Zielseiten mit Abfrage (Filter, ?url=) nur für Seiten-Details; sonst genügt die Grundseite
                u2 = urllib.parse.urlparse(href)
                nur_pfad = href if dateiname(u2.path, u2.query).startswith("seite-") else u2.path
                if nur_pfad not in gesehen:
                    gesehen.add(nur_pfad); gesehen.add(href); offen.append(nur_pfad)
    pdf = re.search(r'href="(/api/[^"]*bericht\.pdf)"', holen(basis, "/projekte/1").decode("utf-8"))
    if pdf:
        (ZIEL / "bericht.pdf").write_bytes(holen(basis, pdf.group(1)))
    print(f"{len(list(ZIEL.glob('*.html')))} Seiten nach {ZIEL}")


if __name__ == "__main__":
    main()
