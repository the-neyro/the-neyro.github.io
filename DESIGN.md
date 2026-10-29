# Gestaltung der Nextfix-Website

> **Fassung 4 (2026-10-29, ein Design für App und Website):**
> - Idee: Wo alle SEO-Tools mit Dashboards schreien, zeigt die Seite leise eine Sache: die eine nächste Aufgabe, wie die App. Richtung „The quiet instrument“.
> - Tokens 1:1 aus der App (`app/web/static/app.css`): Grund #fbf7f8, Text #111827, Himbeere #b8336a (Leiter bis #6b1d3e), Radius 8 px; dunkel per `prefers-color-scheme` (Grund #0e0e0f, Akzent #e2759f). `theme-color` je Schema. Ein Akzent je Bildschirm, Knöpfe nur Himbeere.
> - Schrift: DM Sans variabel, lokal (Gewicht 500 für Titel, 600 für Knöpfe und Namen). Fira Mono nur für echten Code.
> - Kante: eine linke Kante `--edge` für Kopf, Held, Text, Module und Fuß, auf allen Seiten gleich. Lesespalte höchstens 62ch, linksbündig an der Kante.
> - Regeln: keine Eyebrows, keine Haarlinien und keine Seitenstreifen außerhalb von Tabellen und Fragmenten, keine Schatten in Ruhe. Bilder sind echte App-Screenshots oder HTML-Fragmente (`data-ui`), keine Fotos.
> - Fuß: eine leise Zeile mit „Neu im Blog“ darüber, auf jeder Seite aus `tools/inhalte.py`. Logo `favicon.svg`, OG-Bilder aus `tools/og-*.html`.

> **Fassung 2 (2026-10-17, nach Review mit 7 Prüfern, siehe `.review/ZUSAMMENFASSUNG.md`):**
> - Farbe: Graphit-Text (#1c1b22) auf hellem Papier (#f7f6f3), **Markenviolett #5B3FBF als einziger Akzent**, tiefes Violett (#2a1f5c) für Prüfungen und Fuß. Oxblood ist raus: wirkte wie Mahnung/„Dringend“ und brach mit dem Produkt.
> - Logo-Zeichen (violettes Quadrat) vor der Wortmarke. Radius 6 px wie im Produkt.
> - Held: Aussage links („Was deine Website als Nächstes braucht.“) mit Unterzeile, zwei Knöpfen und Mac-Hinweis; rechts der Filmstreifen in eigener Spalte mit sichtbarem Anhalten/Nächste.
> - Eine H2-Stufe für alle Abschnitte. Code in Systemschrift mit fester Breite auf Graphit.
> - Gestrichen: Bildwörter, Fuß-Scroll-Animation, leuchtende Prüfungsliste. Hausregeln „kein Violett“, „keine 01/02/03“ (Installationsschritte) und „keine Schatten“ (Produktkarten) bewusst aufgehoben.
> Der Text unten beschreibt Fassung 1 und bleibt als Begründungsgeschichte stehen.

Stand: 2026-10-17. Gebaut mit Taste-Skill v2 (Richtung gezogen), geprüft mit Impeccable 4.6.0.

## Richtung
- Taste-Richtung **„The sentence is the layout“** (`sentence-as-layout`, Seed 970086171, Sektor dev-tool).
  Gewählt, weil Nextfix genau eine Sache verspricht: die *nächste* Aufgabe. Ein Satz mit einem Bildfenster, in dem diese Aufgabe steht, ist nur bei Nextfix wahr.
- **Idee:** Auf dieser Seite wird **die nächste Aufgabe aus „Was jetzt tun“** zum **Wort im Satz** („Repariere [das hier] als Nächstes.“).
  Konkurrenztest: Semrush/Sistrix verkaufen Dashboards mit allem; der Satz passt nicht zu ihnen.
- **Das eine lebendige Ding:** Seitentitel eintippen, Nextfix-Regeln rechnen live im Browser (Länge ≤ 70, Suchbegriff im Title und vorn, Vorschlag wie `title_vorschlag` in `app/onpage/abgleich.py`). Ohne JavaScript: Beispiel mit fertiger Antwort.

## Farben: eigene Palette statt Nextfix-Violett
- Gezogen: **Oxblood und Grau** (`--bg #e2e2e2`, `--surface #d6d6d6`, `--ink #7d0c14`, `--muted #7a4a4e`, Akzent = Tinte).
- **Warum nicht Violett (#5B3FBF):** Violett/Indigo ist die Standardfarbe generierter Seiten (Taste-Hausregel „assistant palette“). Die Website ist Werbefläche, nicht das Werkzeug. Das Violett lebt weiter im Logo (Favicon) und in den echten Screenshots. Oxblood passt zum Bild der Oberfläche („Prüfstand“, Prüfstempel): Stempelfarbe auf grauem Prüfprotokoll, die grauen Flächen der Screenshots fügen sich ein.

## Schrift
- **Fira Sans Condensed 500** für große Zeilen, **Fira Sans 400/500/600** für Text. Lokal aus dem Nextfix-Repo (SIL OFL, `assets/fonts/OFL.txt`).
- Abweichung vom gezogenen Satz (Big Shoulders / Public Sans): Markenschrift von Nextfix und Regel „keine externen Schriften/CDNs“. Condensed übernimmt die Rolle der schmalen Display-Schrift.

## Abschnitte der Startseite (Reihenfolge = Argument)
1. Held: Satz geteilt durch ein Fenster, darin wechseln vier echte Ansichten (Zustand, Was jetzt tun, Problem, Seite optimieren).
2. Gepinnter Satz (große Tools: hunderte Zahlen, Nextfix: kurze Liste), Screenshots laufen daneben vorbei.
3. Überschrift zum Eintippen: Seitentitel-Prüfung (das lebendige Ding).
4. Ablauf als ein Balken (Installieren, Prüfen, Reparieren, Nachprüfen).
5. Absatz mit Bildwörtern (Module).
6. 111 Prüfungen als ein Satz (Namen aus dem echten Katalog).
7. FAQ mit breiter Überschrift.
8. Fuß als Einladung über dem angeschnittenen Namen.
- CTA-Abschnitt „Satz mit Lücke“ gestrichen: kein Formular, kein Newsletter; die Einladung steht im Fuß.

## Bilder
- Nur echte Screenshots der Nextfix-Oberfläche (Demo „Radhaus Elbe“, erfunden), zugeschnitten als WebP in `assets/img/`. Keine Stockfotos.

## Hausregeln (Taste), kurz
Überschriften ≤ 2 Zeilen, keine Eyebrows, kein Monospace außer Code, keine 01/02/03, keine Haarlinien, keine Verläufe, keine Schatten in Ruhe, kein Violett, keine Icon-Karten, kein Glas.

## Bewegung (Stand 2026-10-17)
Leitidee: Bewegung erzählt das Produkt – eine Aufgabe wird erledigt, die nächste rückt nach. Nur CSS und ein paar Zeilen JS, keine Bibliothek; fast alles über `transform`/`opacity`, Scroll-Effekt im Compositor.
- **Held:** Satzhälften steigen aus einer Kante auf (Maske), danach der Filmstreifen.
- **Filmstreifen (Hauptmoment):** die erledigte Aufgabe wird durchgestrichen (Strich wird gezogen), dann rückt die nächste nach.
- **Seitentitel-Prüfung:** die Linie unter dem Titel füllt sich bis 70 Zeichen, zuckt einmal bei „zu lang“; ändert sich ein Urteil, leuchtet die Zeile kurz auf und das neue Urteil springt hinein.
- **Bildwörter:** die kleinen Ausschnitte springen nach dem Satz einzeln auf.
- **FAQ:** Antworten klappen weich auf (nur Browser mit `interpolate-size`, sonst sofort).
- **Fuß:** der große Name hebt sich mit dem Scrollen (`animation-timeline`, sonst statisch).
- **Seitenwechsel:** Kopf bleibt stehen, Inhalt blendet über (View Transitions, Chrome/Safari).
- `prefers-reduced-motion: reduce`: keine Wege, nur Farbe/Deckkraft; Urteil-Aufleuchten bleibt (Rückmeldung).
- Ideen gegengeprüft mit Impeccable `animate` und dem Skill „web-motion-design“ (dylantarre/animation-principles, MIT, nicht installiert).
