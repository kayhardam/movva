# Weekschema

Een aanpasbaar weekschema voor wedstrijdsport en krachttraining. Je stelt je sport, je trainings- en wedstrijddagen en je oefeningen in; de app deelt de krachttrainingen in rond de sport, houdt je log bij en zegt wat je vandaag tilt.

Geen account en geen server: je log blijft in je eigen browser, en een schema deel je via een link.

## Starten

```sh
npm install
npm run dev      # ontwikkelserver
npm test         # rekenregels testen
npm run check    # TypeScript en Svelte controleren
npm run build    # productieversie in dist/
```

## Opbouw

```
src/lib/
  dates.ts            datums als 'YYYY-MM-DD', rekenen zonder zomertijdgedoe
  plan/schema.ts      het schema als data: Zod-definities, types en controle
  plan/default-plan.ts  Kays vierdagenschema, het voorbeeld voor nieuwe bezoekers
  log/schema.ts       gelogde trainingen, die zichzelf beschrijven
  phase.ts            week, blok en lichte week op een datum
  advice.ts           wat je vandaag tilt: dubbele progressie
  plates.ts           welke schijven aan elke kant
  planner.ts          de weekindeling, met de keuze per week
```

Alles in `src/lib` is gewone TypeScript zonder scherm, en elk bestand heeft een `.test.ts` ernaast. De schermen (Svelte) gebruiken die functies alleen.

## Keuzes

- **Svelte + Vite + TypeScript.** Het instelscherm heeft veel samenhangende status; Svelte houdt het scherm bij zonder zware runtime, en tekst in `{...}` wordt altijd ge-escaped, dus een gedeeld schema kan geen script meesmokkelen.
- **Zod.** Eén definitie geeft de types én de controle van alles wat via een link of import binnenkomt. Het kost wel wat: ongeveer 29 kB van de 43 kB (gzip). `zod/mini` zou dat naar ongeveer 9 kB brengen, ten koste van leesbaarheid.
- **Het schema is data.** Ook de weekregels: "kracht D op vrijdag als dat vrij is, anders zaterdag, nooit de dag voor een wedstrijd" is één regel in het plan, en `planWeek()` past hem toe.
- **Tests in Nederlandse tijd** (`TZ=Europe/Amsterdam` in `vite.config.ts`), zodat de overgang naar zomertijd echt in de tests zit.

## Stand van zaken

Klaar: schema, rekenregels en weekindeling, met tests. Nog te doen: logboekscherm, instelscherm, opslag met export, import en deellink, installeerbaar en offline, NL en EN.
