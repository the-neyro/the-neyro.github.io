titel: Ladezeit zählt jetzt zum Website-Zustand
beschreibung: Eine langsame Seite ist ein echtes Problem, also fließt die Ladezeit jetzt in den Website-Zustand ein. So misst Nextfix sie und so wird gerechnet.

Bisher stand die Ladezeit in Nextfix für sich: eine eigene Messung, ein eigener Bereich, aber kein Einfluss auf die Zahl, die du zuerst siehst. Das war unehrlich. Eine Seite, die auf dem Handy fünf Sekunden zum Aufbau braucht, hat ein Problem, auch wenn Titel und Links stimmen.

## Was sich geändert hat

- Drei neue Prüfungen: **größtes Element lädt zu langsam** (LCP), **Layout springt beim Laden** (CLS) und **Seite blockiert zu lange** (TBT). Gemessen wird für das Handy. LCP und CLS gehören zu Googles Core Web Vitals. Der dritte, die Reaktionszeit (INP), lässt sich nur bei echten Besuchern messen; TBT ist der Laborwert, der ihm am nächsten kommt. Gut ist laut Google: LCP bis 2,5 Sekunden, INP unter 200 Millisekunden, CLS unter 0,1.
- Die Ladezeit misst Nextfix auf deinem Rechner, mit einem echten Chromium und gedrosselter Leitung, wie Lighthouse. Bei einer einzelnen Vergleichsmessung an einer Testseite lagen wir bei 96, PageSpeed Insights bei 99.
- Gerechnet wird nur mit den Seiten, die tatsächlich gemessen wurden. Wenn du nur fünf Seiten misst und zwei sind langsam, wiegt das schwer, egal wie groß die Website ist.
- Nach jeder Messung rechnet Nextfix den Zustand neu. Auf Wunsch misst es nach jeder Prüfung automatisch mit.

## Was es nicht ist

Das sind Labormessungen, keine Daten von echten Besuchern. Die Werte zeigen dir, wo es hakt. Was Google bei echten Besuchern misst, siehst du in der Search Console.
