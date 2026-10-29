titel: Vier Aufgaben später: Website-Zustand von 49 auf 91
beschreibung: Wir haben an der Demo-Website die ersten vier Aufgaben aus „Was jetzt tun“ wirklich erledigt und neu geprüft. Was sich geändert hat und was nicht.
uhrzeit: 20:00

Nextfix sagt dir, was als Nächstes dran ist. Aber bringt das Abarbeiten überhaupt etwas? Wir haben es an unserer erfundenen Demo-Website „Radhaus Elbe“ ausprobiert, mit einer echten Prüfung vorher und nachher.

## Was wir gemacht haben

Die ersten vier Aufgaben aus der Liste haben wir an einer zweiten Fassung der Demo-Website erledigt:

1. **Seiten mit wenig Text:** sieben Seiten ausgebaut, Impressum und Datenschutz auf „noindex“ gesetzt.
2. **Eigene Beschreibungen** für vier Seiten, die sich vorher eine geteilt haben.
3. **Sitemap bereinigt:** keine Weiterleitung und keine gesperrten Seiten mehr drin.
4. **Seite „nicht gefunden“ behoben:** der Link auf eine alte Aktion zeigt jetzt auf die Preisseite.

Bildbeschreibungen, zu lange Titel und eine fehlende Beschreibung haben wir absichtlich offen gelassen.

## Das Ergebnis

- **Website-Zustand:** 48,7 vorher, 90,6 nachher.
- **Technik:** 79 → 100. **Inhalt:** 61 → 91. **KI-Suche:** fast gleich, 82,6 → 82,0, weil jetzt zwei Seiten weniger in die Rechnung eingehen und sich die Anteile leicht verschieben.
- **Aufgaben:** 8 vorher, 3 nachher, alle mit geringer Wirkung: Bildbeschreibungen, zu lange Titel, eine fehlende Beschreibung.
- **Geprüfte Seiten:** 17 → 15. Die Seite „nicht gefunden“ und die Weiterleitung tauchen nicht mehr auf, weil nichts mehr auf sie zeigt.

## Was das nicht heißt

Der Website-Zustand misst, wie gepflegt eine Website ist. Wie sie danach bei Google steht, kann niemand versprechen. Saubere Technik und eigene Beschreibungen sind aber die Grundlage dafür, dass Google deine Seiten richtig versteht.

## Ein Fehler, den wir dabei gefunden haben

Die Aufgabe sagt „Bau die Seiten aus **oder nimm sie aus dem Index**“. Nextfix hat Seiten auf „noindex“ aber trotzdem weiter als „wenig Text“ gezählt. Im ersten Lauf standen Impressum und Datenschutz deshalb nachher noch auf der Liste, und der Zustand lag bei 82,1.

Das ist jetzt behoben und seit Version 0.1.0 drin. Ehrlich dazu: Für Google bringt „noindex“ auf Impressum und Datenschutz nichts, kurze Pflichtseiten sind völlig normal. Wir haben es nur gemacht, um die Aufgabe an der Demo abzuschließen. Mit dem Fix haben wir beide Fassungen noch einmal geprüft: 48,7 vorher, **90,6 nachher**. Die Zahlen oben sind die aus diesem zweiten Lauf.

## Nachtrag, 28. Oktober 2026: neue Bewertung seit Version 0.2.3

Die Zahlen oben stammen vom 17. Oktober und bleiben so stehen. Seit Version 0.2.3 bewertet Nextfix ehrlicher, nach dem, was Google Search Central und web.dev tatsächlich sagen: „Wenig Text“ zählt nur noch als Warnung, weil Google nicht nach Länge rankt, und Impressum und Datenschutz zählen dort nicht mehr. Dieselbe Demo-Website steht deshalb heute bei **64,0 vorher** und **90,6 nachher** (gerundet 91). Aus acht Aufgaben werden drei, fünf davon sind erledigt. Der Weg ist derselbe, nur der Startwert ist gerechter. Was sich geändert hat, steht im Changelog zu 0.2.3.
