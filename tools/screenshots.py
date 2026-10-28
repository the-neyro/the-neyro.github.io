"""Produktbilder der Website (assets/img/shot-*.webp) aus der Nextfix-Demo aufnehmen.

Ausschnitte statt Vollansichten, damit der Text im Bild lesbar bleibt:
- „breit“: für große Flächen am Desktop, Ausschnittbreite etwa wie die Anzeigebreite.
- „schmal“: die App bei Handybreite (390 px), für Handys und schmale Spalten.

Jede Fassung wird scharf aufgenommen (deviceScaleFactor 2–4) und als WebP in mehreren
Breiten für srcset gespeichert (größte Breite 2400–2800 px am Desktop).

Braucht ein Nextfix-Repo mit Demo-Datenbank (data/demo.db aus `python -m scripts.screenshots`),
Playwright aus dessen .venv und cwebp (brew install webp):
    /pfad/zu/nextfix/.venv/bin/python tools/screenshots.py /pfad/zu/nextfix
"""

from __future__ import annotations

import os
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

from playwright.sync_api import sync_playwright

WURZEL = Path(__file__).resolve().parent.parent
ZIEL = WURZEL / "assets/img"
PORT = 8011
BASIS = f"http://127.0.0.1:{PORT}"
QUALITAET = 90
RAND = 12  # App-Hintergrund rund um den Ausschnitt, in CSS-Pixeln
# Nextfix-Fehler bei Handybreite: eine lange Kopfzeile (Positionen, Seite optimieren) macht die ganze Seite
# breiter als den Bildschirm. Für die Aufnahme abgefangen; die Kopfzeile liegt dort außerhalb des Ausschnitts.
KORREKTUR_CSS = ""  # die neue App ist schmal von selbst responsiv

# Name, Pfad, Fassungen: (Fassung, Viewport-Breite, Skalierung, Elemente von–bis, max. Höhe, Ausgabebreiten)
# „Elemente von–bis“: der Ausschnitt reicht vom oberen Rand des ersten bis zum unteren Rand des zweiten Selektors;
# endet er an einem Listeneintrag, sieht man, dass es weitergeht.
MOTIVE = [
    ("uebersicht", "/projekte/1", [
        ("breit", 1440, 2.2, ("section.karte:has(.aufgaben)", ".teilnoten"), 900, (800, 1200, 1600, 2400)),
        ("schmal", 390, 3, ("section.karte:has(.aufgaben)", ".aufgaben > li:nth-child(1)"), 1100, (760, 1140)),
    ]),
    ("aufgaben", "/projekte/1", [
        ("breit", 1440, 3.5, ("section.karte:has(.aufgaben)", ".aufgaben > li:nth-child(4)"), 900, (800, 1300, 1600, 2600)),
        ("schmal", 390, 3, ("section.karte:has(.aufgaben)", ".aufgaben > li:nth-child(2)"), 900, (760, 1140)),
    ]),
    ("problem", "/crawls/1/issues/wenig_text/seite", [
        ("breit", 600, 4.2, (".brotkrumen", "tbody tr:nth-child(5)"), 900, (800, 1200, 1600, 2400)),
        ("schmal", 390, 3, (".brotkrumen", ".raster"), 900, (760, 1140)),
    ]),
    ("seite-optimieren", "/onpage/1", [
        ("breit", 600, 4.2, ("#ergebnis .kennzahlen", "#ergebnis section.karte"), 900, (800, 1200, 1600, 2400)),
        ("schmal", 390, 3, ("#ergebnis section.karte", "#ergebnis section.karte"), 900, (760, 1140)),
    ]),
    ("positionen", "/projekte/1/positionen", [
        ("breit", 772, 3.5, ("div.kennzahlen", "aside section.karte"), 900, (800, 1300, 1600, 2600)),
        ("schmal", 390, 3, ("div.kennzahlen", "section.karte:has(.tabelle)"), 900, (760, 1140)),
    ]),
    ("zustand", "/projekte/1", [
        ("schmal", 390, 3, (".messung", ".teilnoten"), 900, (760, 1140)),
    ]),
    ("lead", "/projekte/1", [
        ("breit", 1440, 3.5, (".aufgaben:not(.lead) > li >> nth=0", ".aufgaben:not(.lead) > li >> nth=0"), 600, (800, 1300)),
    ]),
    ("ki-suche", "/crawls/1/themen/ki", [
        ("breit", 1000, 3, ("h1", ".raster"), 800, (800, 1200)),
    ]),
    ("ladezeit", "/crawls/1/vitals", [
        ("breit", 1000, 3, ("h1", ".raster"), 800, (800, 1200)),
    ]),
    ("suchbegriffe", "/projekte/1/keywords", [
        ("breit", 1000, 3, ("h1", ".karte >> nth=0"), 800, (800, 1200)),
    ]),
    ("projekte", "/", [
        ("breit", 632, 4, ("#liste", "section.karte:has(form)"), 900, (800, 1200, 1600, 2400)),
        ("schmal", 390, 3, ("section.karte:has(form)", "section.karte:has(form)"), 900, (760, 1140)),
    ]),
]


def server_starten(nextfix: Path) -> subprocess.Popen:
    env = dict(os.environ, SEO_DB=str(nextfix / "data/demo.db"))
    prozess = subprocess.Popen([sys.executable, "-m", "uvicorn", "app.web:app", "--port", str(PORT),
                                "--log-level", "warning"], cwd=nextfix, env=env)
    for _ in range(100):
        try:
            urllib.request.urlopen(BASIS, timeout=1)
            return prozess
        except OSError:
            time.sleep(0.2)
    prozess.kill()
    sys.exit("Nextfix-Server startet nicht")


def ausschnitt(seite, von: str, bis: str, max_hoehe: int) -> dict:
    """Rechteck vom oberen Rand von `von` bis zum unteren Rand von `bis`, mit Rand, höchstens max_hoehe hoch."""
    oben = seite.locator(von).first.bounding_box()
    unten = seite.locator(bis).first.bounding_box()
    x = min(oben["x"], unten["x"]) - RAND
    rechts = max(oben["x"] + oben["width"], unten["x"] + unten["width"]) + RAND
    y = oben["y"] - RAND
    hoehe = min(unten["y"] + unten["height"] + RAND - y, max_hoehe)
    return {"x": max(x, 0), "y": max(y, 0), "width": rechts - max(x, 0), "height": hoehe}


def webp(png: Path, ziel: Path, breite: int) -> None:
    subprocess.run(["cwebp", "-quiet", "-q", str(QUALITAET), "-m", "6", "-sharp_yuv",
                    "-resize", str(breite), "0", str(png), "-o", str(ziel)], check=True)


def aufnehmen() -> None:
    with sync_playwright() as pw, tempfile.TemporaryDirectory() as tmp:
        browser = pw.chromium.launch()
        for name, pfad, fassungen in MOTIVE:
            for fassung, breite, skala, (von, bis), max_hoehe, breiten in fassungen:
                kontext = browser.new_context(viewport={"width": breite, "height": 1000}, device_scale_factor=skala,
                                              color_scheme="light", reduced_motion="reduce")
                seite = kontext.new_page()
                seite.goto(BASIS + pfad, wait_until="networkidle")
                if KORREKTUR_CSS:
                    seite.add_style_tag(content=KORREKTUR_CSS)
                seite.evaluate("document.fonts.ready")
                rechteck = ausschnitt(seite, von, bis, max_hoehe)
                png = Path(tmp) / f"{name}-{fassung}.png"
                seite.screenshot(path=png, clip=rechteck, full_page=True)
                for b in breiten:
                    webp(png, ZIEL / f"shot-{name}-{fassung}-{b}.webp", b)
                print(f"✓ {name}-{fassung}: {rechteck['width']:.0f} × {rechteck['height']:.0f} CSS-px, "
                      f"Seitenverhältnis {rechteck['width'] / rechteck['height']:.4f}, Breiten {breiten}")
                kontext.close()
        browser.close()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    nextfix = Path(sys.argv[1]).resolve()
    server = server_starten(nextfix)
    try:
        aufnehmen()
    finally:
        server.terminate()
