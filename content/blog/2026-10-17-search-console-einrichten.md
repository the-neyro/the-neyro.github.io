titel: Google Search Console einrichten, Schritt für Schritt
beschreibung: Mit der kostenlosen Search Console siehst du, wofür Google deine Website zeigt und welche Seiten fehlen. So richtest du sie ein, auch ohne Technikkenntnisse.
rubrik: ratgeber
uhrzeit: 21:20

Die Search Console ist ein kostenloses Werkzeug von Google. Sie zeigt dir, bei welchen Suchbegriffen deine Website erscheint, wie oft jemand klickt und welche Seiten Google nicht aufgenommen hat, samt Grund. Es ist die einzige Quelle, die dir das direkt von Google sagt.

Einrichten kannst du sie nur für deine eigene Website: Du musst einmal beweisen, dass sie dir gehört.

## Was du brauchst

- ein Google-Konto (zum Beispiel ein Gmail-Konto)
- Zugang zu deiner Website, also zum Login von WordPress, Wix oder Jimdo, oder zu deinem Domain-Anbieter
- etwa eine Viertelstunde, plus etwas Wartezeit für die ersten Zahlen

Kommst du nirgends hin, kann dein Webbetreuer das übernehmen. Er kann dich danach als Nutzer eintragen, dann siehst du alles selbst.

## 1. Website hinzufügen

Öffne [search.google.com/search-console](https://search.google.com/search-console) und melde dich an. Google fragt dann, welche Art von „Property“ du anlegen willst:

- **Domain:** erfasst alles, mit und ohne `www`, mit `http` und `https`. Bestätigt wird über einen Eintrag beim Domain-Anbieter (ein sogenannter TXT-Eintrag). Das ist die bessere Wahl, wenn du an die Einstellungen deiner Domain kommst.
- **URL-Präfix:** erfasst nur genau die Adresse, die du eingibst. Bestätigt wird zum Beispiel über ein kurzes Stück Code auf deiner Startseite. Das ist der einfachere Weg, wenn du nur an deine Website kommst.

## 2. Bestätigen, dass die Website dir gehört

Google zeigt dir einen Code und sagt, wohin er gehört.

- **Domain:** Den TXT-Eintrag legst du in der Verwaltung deines Domain-Anbieters an, meist unter „DNS“. Danach in der Search Console auf „Bestätigen“ klicken. Klappt es nicht sofort, warte etwas und versuch es später noch einmal; der Eintrag braucht manchmal eine Weile.
- **URL-Präfix in WordPress:** Wähl bei Google die Methode „HTML-Tag“. Yoast und Rank Math haben ein Feld dafür: bei Yoast unter „Website-Verbindungen“, bei Rank Math unter „Allgemeine Einstellungen → Webmaster-Tools“. Dort fügst du den Code ein, speicherst und klickst bei Google auf „Bestätigen“.
- **Wix und Jimdo** bieten ebenfalls einen Weg, die Search Console zu verbinden. Such in den Einstellungen nach „SEO“ oder „Google Search Console“.

## 3. Sitemap einreichen

Die Sitemap ist eine Liste aller Seiten deiner Website. Damit findet Google sie schneller. Klick links auf **Sitemaps**, trag die Adresse ein und klick auf „Senden“. Übliche Adressen:

- WordPress mit Yoast oder Rank Math: `sitemap_index.xml`
- WordPress ohne Plugin: `wp-sitemap.xml`
- Wix und Jimdo legen die Sitemap selbst an, meist unter `sitemap.xml`

Steht danach „Erfolgreich“ da, ist alles gut.

## 4. Ein paar Tage warten, dann reinschauen

Die ersten Zahlen kommen nach einigen Tagen. Zwei Berichte lohnen sich zuerst:

- **Leistung:** für welche Suchbegriffe du erscheinst (Impressionen), wie oft geklickt wird und auf welchem Platz du im Schnitt stehst.
- **Seiten** (unter „Indexierung“): welche Seiten Google aufgenommen hat und welche nicht, mit Grund.

## Und was hat Nextfix damit zu tun?

Nextfix fragt Google nicht selbst ab, denn das verbieten Googles Regeln. Stattdessen holt es auf Wunsch einmal am Tag deine Daten aus der Search Console und zeigt sie unter „Positionen“: Sichtbarkeit, Aufsteiger und Absteiger und Suchbegriffe, bei denen du fast auf Seite 1 stehst. Die Verbindung richtest du einmal ein, das dauert etwa zehn Minuten; die [Anleitung](https://github.com/the-neyro/nextfix/blob/main/docs/anleitung-gsc.md) liegt im Projekt auf GitHub.

![Positionen mit Sichtbarkeit, durchschnittlichem Platz, „Fast auf Seite 1“ und Aufsteigern](../../assets/img/shot-positionen-breit-1300.webp "„Positionen“ in Nextfix, hier mit Testdaten der erfundenen Demo-Website. [In der Demo ansehen](../../demo/projekte-1-positionen.html)")
