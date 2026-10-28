titel: Nextfix prüft seine eigene Website
beschreibung: Drei Durchläufe an dieser Website: von 64 auf 98. Was davon echte Verbesserung war, was Fehlalarme von Nextfix selbst und was wir daraus gelernt haben.
uhrzeit: 14:00

Alle Zahlen auf dieser Website stammen bisher von „Radhaus Elbe“, einer erfundenen Demo-Website. Das ist praktisch, beweist aber wenig. Also haben wir Nextfix auf die echte Website losgelassen, die du gerade liest: the-neyro.github.io, mit Blog, Prüfungskatalog und der klickbaren Demo. Hier sind die drei Durchläufe, auf die es ankommt (dazwischen gab es ein paar Testläufe mit ähnlichem Ergebnis), alle mit Nextfix selbst.

## Durchlauf 1: 64,3

Am 17. Oktober abends, noch ohne den Fix aus Version 0.2.1: 76 Seiten, Website-Zustand **64,3**. Ganz oben standen 21 doppelte Seitentitel, 54 Seiten ohne Beschreibung und zwei fast gleiche Seiten.

Das klang schlimm, stimmte aber nicht. Alle Funde lagen in /demo/, der klickbaren Kopie der Oberfläche. Diese Seiten sind mit „noindex“ für Google ausgeblendet, Google zeigt sie also nie an. Nextfix hat sie trotzdem mitgezählt. Das war ein Fehler in Nextfix, nicht auf der Website.

## Durchlauf 2: 66,3

Der Fehler ist seit Version 0.2.1 behoben: Seiten mit „noindex“ zählen nicht mehr bei Titeln, Beschreibungen, Überschriften und doppeltem Inhalt. Am 18. Oktober mit 0.2.2 waren diese Funde weg. Der Zustand lag trotzdem nur bei **66,3**, denn diesmal meldete Nextfix vier Seiten als „nicht erreichbar“ und deshalb defekte Links auf 16 Seiten.

Auch das stimmte nicht. Die vier Seiten liefen, im Browser und bei einem zweiten Abruf. Während des Durchlaufs hatte nur der Verbindungsaufbau zu GitHub ein paar Mal zu lange gedauert. Nextfix versucht es in so einem Fall bisher nicht ein zweites Mal. Das reparieren wir gerade.

Zwei echte Funde gab es: Ein Blogbeitrag hatte nur 194 Wörter, und auf der Startseite fehlte die maschinenlesbare Angabe, wer hinter der Website steht. Beides haben wir behoben.

## Durchlauf 3: 97,9

Kurz danach, gleicher Code, 78 Seiten: **97,9**. Keine dringenden Aufgaben mehr, eine wichtige, dazu vier Hinweise als Feinschliff. Technik, Inhalt, HTTPS und Crawlbarkeit stehen bei 100.

Ehrlich gesagt: Der Sprung von 66 auf 98 kommt fast ganz daher, dass die Zeitüberschreitungen diesmal nicht auftraten. Unsere eigenen Änderungen haben nur einen kleinen Teil beigetragen.

## Was übrig bleibt

- **Zwei „defekte“ Links, beide in Ordnung.** Der Hilfe-Link zur Search Console liefert Nextfix eine 404, einem normalen Browser aber die Seite. Google behandelt Abrufe mit Bot-Kennung anders. Und der Knopf „Nextfix öffnen“ zeigt absichtlich auf `localhost`, also auf das Programm auf deinem eigenen Rechner. Beides soll Nextfix künftig erkennen.
- **54 Seiten für Google gesperrt:** die Demo, mit Absicht.
- **CSS und JavaScript nicht verkleinert:** stimmt. Bei einem Stylesheet und einem Skript bringt das wenig, steht aber auf der Liste.
- **Texte ohne Zahlen und Quellen** auf sieben Seiten, **Fragen ohne FAQ-Markup** auf zwei: Feinschliff für die KI-Suche, als Nächstes dran.

## Was wir daraus gelernt haben

Ein Prüfwerkzeug muss sich selbst prüfen lassen. Die eigene Website hat Nextfix drei echte Schwächen gezeigt: noindex-Seiten zählten mit (behoben in 0.2.1), ein einzelner langsamer Abruf zählte als Ausfall, und manche Links werden mit Bot-Kennung falsch eingeschätzt (beides in Arbeit). Jede davon hätte auch bei dir zu falschen Aufgaben geführt.

Für dich heißt das: Wenn Nextfix etwas meldet, schau kurz nach, ob es stimmt. Ist es Absicht, blendest du es mit „Bewusst so“ aus, dann zählt es nicht mehr. Und wenn Nextfix sich irrt, freut sich das Projekt über ein [Issue auf GitHub](https://github.com/the-neyro/nextfix/issues).

Gemessen am 17. und 18. Oktober 2026, zuerst mit dem Stand vor 0.2.1, dann mit 0.2.2, Projekt „the-neyro.github.io“, Standardeinstellungen (500 Seiten, robots.txt beachten).

## Nachtrag, 28. Oktober 2026: neue Bewertung seit Version 0.2.3

Gemessen wurde mit 0.2.1 und 0.2.2. Seit 0.2.3 gewichtet Nextfix ehrlicher, nach Google Search Central und web.dev: „Wenig Text“ ist nur noch eine Warnung, Rechtsseiten zählen dort nicht mehr, und eine langsame Serverantwort beginnt erst bei 1,8 Sekunden. Zustand und Aufgaben einer Website können sich dadurch gegenüber den Zahlen oben verschieben. Die Messung oben bleibt, wie sie war. Die Demo-Website „Radhaus Elbe“ steht mit der neuen Bewertung bei 64,0 und nach den Aufgaben bei 90,6.
