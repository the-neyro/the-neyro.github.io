# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack
Statisches HTML/CSS ohne Framework und ohne Build-Tool. Hosting später auf GitHub Pages (Adresse offen: `the-neyro.github.io` oder `…/nextfix-site/`). Keine externen CDNs, Schriften, Analytics oder Cookies.

## Users
Betreiber kleiner Websites in Deutschland: Freiberufler, Handwerker, kleine Firmen, Vereine. Sie pflegen ihre Seite selbst (meist im CMS) oder lassen sie von einer Agentur/einem Bekannten betreuen, haben kein SEO-Budget und keine Zeit für Fachbegriffe. Typische Situation: „Meine Seite wird nicht gefunden, ich weiß nicht, wo ich anfangen soll.“ Job: herausfinden, was als Nächstes zu tun ist, und es selbst erledigen oder gezielt weitergeben.

## Product Purpose
Die Website stellt Nextfix vor, ein kostenloses Open-Source-SEO-Tool, das lokal auf dem eigenen Rechner läuft. Erfolg: Besucher verstehen in Sekunden, was Nextfix tut, installieren es oder schauen sich das Repo an. Nebenbei dient die Seite als echter Prüfstand: Nextfix prüft sie selbst, Search Console und Bing liefern echte Daten.

## Positioning
Große SEO-Suiten zeigen hunderte Zahlen und überlassen die Reihenfolge dem Nutzer. Nextfix prüft genauso gründlich und macht daraus eine kurze Liste: was zuerst, warum, wie, und wie viel es bringt (Wirkung hoch/mittel/gering, keine Schein-Genauigkeit). Läuft lokal, kostet nichts, keine bezahlten APIs, keine Google-Ergebnis-Abfragen. Kann komplett von Claude über MCP bedient werden.

## Operating Context
- Nextfix läuft lokal (Python 3.12+, Web-Oberfläche im Browser auf localhost:8000), Oberfläche auf Deutsch, hell/dunkel.
- Module: Website-Check (Crawler, 106 Prüfungen in 8 Bereichen, Website-Zustand 0–100, „Was jetzt tun“), Ladezeit (Core Web Vitals im Labor), Positionen (Search Console, Bing), Autorität (Open PageRank), Suchbegriffe finden, Seite optimieren (Seiten- und KI-Score), Prüfungen für KI-Suche (llms.txt, KI-Crawler, FAQ-Markup).
- Ergebnisse: Aufgabenliste, Problem-Detailseiten, Verlauf, CSV, PDF-Bericht.
- Installation über Terminal (git clone, venv, pip, uvicorn). Das ist für die Zielgruppe eine echte Hürde.

## Capabilities and Constraints
- Kostenlos, MIT-Lizenz, Quellcode öffentlich: https://github.com/the-neyro/nextfix
- Keine Rankings von Konkurrenten, keine einzelnen Backlinks (bräuchte bezahlte Datenbanken). Ladezeit ist Labormessung, keine Felddaten.
- JavaScript-Rendering optional.
- Ansprache auf der Website: **du** (wie in der Nextfix-Oberfläche).
- Privates, nicht kommerzielles Projekt. Kein Kontaktformular.
- Offen: Impressum (ja/nein), Verantwortlicher in der Datenschutzerklärung (vorerst Platzhalter), endgültige Adresse.

## Brand Commitments
- Name: Nextfix. Logo: violettes Quadrat (#5B3FBF) mit Haken und Pfeil (`app/web/static/logo.svg` im Nextfix-Repo).
- Schrift der Oberfläche: Fira Sans (SIL OFL), lokal ausgeliefert.
- Begriffe der Oberfläche: Website-Zustand, Dringend / Wichtig / Feinschliff, Wirkung hoch / mittel / gering, „Was jetzt tun“, „Bewusst so“.
- Kein Firmen-Branding: privates Projekt.

## Evidence on Hand
- Echte Screenshots der Oberfläche (hell und dunkel) mit der erfundenen Demo-Website „Radhaus Elbe“: `docs/screenshots/` im [Nextfix-Repo](https://github.com/the-neyro/nextfix).
- Fakten aus dem README (106 Prüfungen, 50 MCP-Tools, 257 Tests, Module).
- Keine Kunden, Testimonials, Downloadzahlen, Presse oder Logos. Nichts davon erfinden.

## Product Principles
1. Klartext vor Fachbegriff: jede Aussage so, dass ein Tischler sie versteht.
2. Ehrlich statt beeindruckend: keine erfundenen Zahlen, Grenzen offen nennen.
3. Die nächste Handlung zählt, nicht die Menge der Daten.
4. Die Website hält sich selbst an das, was Nextfix prüft (schnell, sauber, zugänglich).

## Accessibility & Inclusion
WCAG 2.1 AA: Kontrast, Tastaturbedienung, sichtbarer Fokus, Alternativtexte, reduzierte Bewegung.
