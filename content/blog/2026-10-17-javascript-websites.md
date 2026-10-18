titel: Websites, die erst im Browser entstehen
beschreibung: Manche Websites schicken fast leeres HTML und bauen den Inhalt per JavaScript. Nextfix erkennt das jetzt und kann solche Seiten auch richtig prüfen.
uhrzeit: 12:00

Betrifft dich nur, wenn deine Website mit einem JavaScript-Framework wie React oder Vue gebaut ist. Klassische Websites, etwa mit WordPress, liefern ihren Text ganz normal aus.

Viele moderne Websites sind eigentlich Apps: Der Server schickt eine fast leere Seite, und erst das JavaScript im Browser baut Texte, Menüs und Links. Für Besucher ist das kein Unterschied. Für ein Prüfwerkzeug schon: Wer nur das HTML liest, sieht eine leere Seite und meldet lauter falsche Fehler.

## Was Nextfix jetzt macht

- **Es erkennt das Muster.** Findet Nextfix einen leeren App-Container (etwa `<div id="root"></div>`) und kaum Text, zeigt die Übersicht einen Hinweis: Diese Website entsteht per JavaScript, prüf sie mit eingeschaltetem Rendering.
- **Es kann rendern.** In den Einstellungen gibt es dafür einen Schalter. Dann lädt Nextfix jede Seite in einem echten Chromium und prüft, was ein Besucher sieht. Bilder, Schriften und Videos lässt es dabei weg, damit es schneller geht.
- **Es vergleicht.** Mit Rendering misst Nextfix zusätzlich, wie viel Text erst durch JavaScript entsteht. Steht der wichtige Inhalt nur dort, gibt es eine eigene Aufgabe dafür, denn nicht jede Suchmaschine und viele KI-Crawler warten nicht auf dein JavaScript. Google führt JavaScript zwar aus, oft aber erst mit Verzögerung.

Für klassische Websites, etwa mit WordPress, ändert sich nichts. Bei einer statischen Testseite waren die Ergebnisse mit und ohne Rendering gleich.
