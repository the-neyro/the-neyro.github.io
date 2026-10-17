"""Vorschaubild (assets/img/og.png, 1200 × 630) und Apple-Touch-Icon (180 × 180) erzeugen.

Braucht Playwright mit Chromium (z. B. aus der Nextfix-Umgebung):
    /pfad/zu/nextfix/.venv/bin/python tools/og_bild.py
"""

import asyncio
from pathlib import Path

from playwright.async_api import async_playwright

WURZEL = Path(__file__).resolve().parent.parent


async def main() -> None:
    async with async_playwright() as p:
        # Schriften liegen lokal; ohne diesen Schalter blockt Chromium file://-Fonts
        browser = await p.chromium.launch(args=["--allow-file-access-from-files"])
        seite = await browser.new_page(viewport={"width": 1200, "height": 630})
        await seite.goto((WURZEL / "tools/og-bild.html").as_uri())
        await seite.evaluate("document.fonts.ready")
        await seite.screenshot(path=str(WURZEL / "assets/img/og.png"))

        # Touch-Icon: Favicon randlos und eckig, die Ecken rundet iOS selbst ab
        svg = (WURZEL / "favicon.svg").read_text(encoding="utf-8").replace('rx="8"', 'rx="0"')
        svg = svg.replace("<svg ", '<svg width="180" height="180" ', 1)
        icon = await browser.new_page(viewport={"width": 180, "height": 180})
        await icon.set_content(f'<body style="margin:0">{svg}</body>')
        await icon.screenshot(path=str(WURZEL / "assets/img/apple-touch-icon.png"))
        await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
