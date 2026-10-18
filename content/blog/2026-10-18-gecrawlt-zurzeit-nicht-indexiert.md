titel: „Gecrawlt – zurzeit nicht indexiert“ einfach erklärt
beschreibung: Die Meldungen im Bericht „Seiten“ der Search Console in Klartext: welche normal sind, welche du beheben solltest und wie du sie selbst prüfst.
rubrik: ratgeber
entwurf: ja
uhrzeit: 16:00

Du öffnest die Search Console, klickst auf **Seiten** und siehst eine lange Liste unter „Warum Seiten nicht indexiert werden“. Das wirkt alarmierend, ist aber oft harmlos. Nicht jede Seite gehört in Google, und manche Meldungen beschreiben nur, dass Google gerade noch nicht so weit ist. Hier die häufigsten Meldungen, sortiert danach, ob du etwas tun musst.

Indexiert heißt: Google hat die Seite aufgenommen und kann sie im Suchergebnis zeigen. Gecrawlt heißt: Google hat sie abgerufen. Das sind zwei verschiedene Schritte.

## Meist kein Grund zur Sorge

**Seite mit Weiterleitung:** Die Adresse leitet auf eine andere um, Google nimmt das Ziel auf. Das ist normal, etwa wenn `http://` auf `https://` weiterleitet. Nur Ketten über mehrere Stationen solltest du vermeiden.

**Alternative Seite mit richtigem kanonischen Tag:** Die Seite sagt selbst, dass eine andere Adresse die Hauptversion ist, und Google hält sich daran. Alles richtig.

**Durch „noindex“-Tag ausgeschlossen:** Die Seite verbietet Google die Aufnahme. Bei Impressum, Login, Warenkorb oder einer Danke-Seite ist das Absicht. Steht hier aber eine wichtige Seite, ist das ein Fehler, siehe [Warum findet Google meine Website nicht?](../google-findet-meine-website-nicht/).

**Nicht gefunden (404):** Die Adresse gibt es nicht mehr. Wenn das gelöschte Seiten sind, ist es in Ordnung. Zeigen deine eigenen Links noch dorthin, korrigiere die Links. Hatte die Seite Besucher, richte eine Weiterleitung auf die passende neue Seite ein.

## Kommt oft von selbst in Ordnung

**Gefunden – zurzeit nicht indexiert:** Google kennt die Adresse, hat sie aber noch nicht abgerufen. Oft verschiebt Google das, um deinen Server nicht zu überlasten. Bei neuen Websites ist das in den ersten Wochen normal. Hilft: Die Seite in die Sitemap aufnehmen und von anderen eigenen Seiten verlinken.

**Gecrawlt – zurzeit nicht indexiert:** Google hat die Seite abgerufen und sich entschieden, sie vorerst nicht aufzunehmen. Laut Google kann sie später noch aufgenommen werden, ohne dass du sie erneut einreichen musst. Häufige Gründe, die du selbst beeinflussen kannst:

- Die Seite hat wenig eigenen Inhalt, etwa drei Sätze und ein Foto.
- Sie ähnelt einer anderen Seite deiner Website sehr.
- Sie ist kaum verlinkt, Google hält sie deshalb für unwichtig.

Prüf die Seite ehrlich: Würdest du sie selbst bei Google finden wollen? Wenn ja, bau sie aus und verlinke sie von passenden Seiten. Wenn nein, ist es in Ordnung, dass sie fehlt.

## Solltest du dir ansehen

**Duplikat – Google hat eine andere Seite als der Nutzer als kanonische Seite bestimmt:** Du sagst, Seite A ist die Hauptversion, Google hält Seite B dafür. Meist sind sich die beiden Seiten sehr ähnlich. Entscheide dich für eine Seite, leite die andere um oder mach die Inhalte klar unterschiedlich.

**Duplikat – vom Nutzer nicht als kanonisch festgelegt:** Mehrere fast gleiche Adressen, und keine sagt, welche die Hauptversion ist. Typisch sind Adressen mit Filtern oder Sortierung, zum Beispiel `?sort=preis`. Ein kanonischer Verweis (Canonical) auf die Hauptversion löst das. In WordPress setzen Yoast und Rank Math ihn meist von selbst.

**Soft 404:** Die Seite meldet sich als „in Ordnung“, sieht für Google aber aus wie eine Fehlerseite, etwa eine leere Kategorie oder „Keine Produkte gefunden“. Entweder Inhalt ergänzen oder die Seite wirklich als 404 ausliefern bzw. weiterleiten.

**Durch robots.txt-Datei blockiert:** Google darf die Seite nicht abrufen. Bei Admin-Bereichen ist das richtig. Bei normalen Inhaltsseiten ist es meist ein Versehen. Wichtig: robots.txt verhindert nicht zuverlässig, dass eine Adresse im Suchergebnis auftaucht. Dafür ist „noindex“ da.

## So prüfst du eine einzelne Seite

Gib die Adresse der Seite oben in der Search Console in die Suchleiste ein (URL-Prüfung). Du siehst, ob sie bei Google ist und warum nicht. Nachdem du etwas geändert hast, kannst du dort „Indexierung beantragen“. Garantiert ist die Aufnahme damit nicht, aber Google schaut früher wieder vorbei.

Wie du die Search Console überhaupt einrichtest, steht in [Google Search Console einrichten, Schritt für Schritt](../search-console-einrichten/).

## Nextfix findet die Ursachen vorher

Die Search Console sagt dir, was Google entschieden hat. Nextfix prüft die Gründe auf deiner Website, bevor Google darüber stolpert: [Seiten für Google gesperrt](../../pruefungen/#p-blockiert), [Seiten mit 4xx-Statuscode](../../pruefungen/#p-status_4xx), [Redirect-Ketten](../../pruefungen/#p-redirect_kette), [doppelter Inhalt](../../pruefungen/#p-duplicate_content), [kaputte Hauptversion (Canonical)](../../pruefungen/#p-canonical_defekt), [wenig Text](../../pruefungen/#p-wenig_text) und [falsche Seiten in der Sitemap](../../pruefungen/#p-sitemap_falsche_seiten). In „Was jetzt tun“ stehen sie nach Wirkung sortiert.

## Quellen

- Google-Hilfe: [Bericht zur Seitenindexierung](https://support.google.com/webmasters/answer/7440203?hl=de)
- Google Search Central: [Doppelte URLs zusammenfassen (Canonical)](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls?hl=de)
- Google Search Central: [Einführung in robots.txt](https://developers.google.com/search/docs/crawling-indexing/robots/intro)
