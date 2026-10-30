# Module 2 — Logboek

Na deze module train je met Movva. Je opent hem in de sportschool, ziet wat er vandaag op
het programma staat, logt je sets en ziet wat je de volgende keer tilt. Op je telefoon,
zonder account, en het blijft bewaard in je browser.

Het schema is in deze module nog vast: Kays vierdagenschema. Zelf instellen is module 3.

## Uitvoeringsregels

- Rekenwerk test-first in `src/lib`; schermen bevatten geen regels.
- Controle op een echt gerenderde pagina op 390 px breed, licht en donker.
- Baseline: 58 tests, check, lint en build groen. Zo houden.

## Wat er komt

1. **Vandaag.** Week, blok en doelen; de week met wat gepland en wat gelogd is; de keuze voor
   deze week (handbal, wedstrijd); en de training van vandaag, die je kunt wisselen.
2. **Training loggen.** Per oefening het advies en wat je vorige keer deed, sets met kilo's en
   herhalingen, de schijven per kant, de techniektip en wisselen (pull-up ↔ lat pulldown).
   Handbal, wedstrijd en conditie met minuten en tips. Een notitie per training.
3. **Opslaan zonder knop.** Direct in de browser, met een statuslampje, ook als je de app
   wegklikt of je scherm vergrendelt. Een training wissen kan, met bevestiging.
4. **Voortgang.** Per oefening je werkgewicht, het verloop en je vooruitgang; handbal en
   conditie van de laatste vier weken; de lijst met gelogde trainingen.
5. **Scherm aan.** Een knop die je scherm aan houdt tijdens de training.

## Scope-beslissingen

- **Opslag in IndexedDB, via Dexie**, niet in localStorage: meer ruimte, zoeken op datum en
  oefening, en versies van de opslag als het datamodel groeit.
- **Opslag achter een eigen laag.** Synchronisatie met een account wordt later een tweede
  uitvoering van die laag, geen herschrijving.
- **De look bouwt voort op het logboek**: grote vlakken, met één hand te bedienen, donkere
  modus. Een eigen huisstijl voor Movva is een aparte module.
- **Lettertypen zitten in de app.** Google Fonts geeft het IP-adres van elke bezoeker door aan
  Google.
- **Niet in deze module:** export, import en deellink (module 4, inclusief je oude log uit
  claude.ai), installeren en offline (module 5), Engels (module 6).

## Acceptatiecriteria

- Je logt een training van vandaag en herlaadt de pagina: alles staat er nog.
- Haal je in alle drie de sets de bovenkant, dan staat er de volgende keer een stap zwaarder
  voorgevuld.
- In een week met handbaltraining én wedstrijd ontbreekt kracht D, met de reden erbij.
- Alles werkt en leest goed op 390 px breed, licht en donker.
