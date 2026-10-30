# Movva

Je weekschema voor wedstrijdsport en krachttraining, straks op [movva.eu](https://movva.eu). Je stelt je sport, je trainings- en wedstrijddagen en je oefeningen in; Movva deelt de krachttrainingen in rond de sport, houdt je log bij en zegt wat je vandaag tilt.

Geen account en geen server: je log blijft in je eigen browser, en een schema deel je via een link.

## Starten

```sh
npm install
npm run dev      # ontwikkelserver
npm test         # rekenregels testen
npm run check    # TypeScript en Svelte controleren
npm run lint     # opmaak en ESLint
npm run build    # statische site in build/
```

## Opbouw

```
src/lib/                  de kern, zonder scherm, elk bestand met een .test.ts ernaast
  dates.ts                datums als 'YYYY-MM-DD', rekenen zonder zomertijdgedoe
  plan/schema.ts          het schema als data: Zod-definities, types en controle
  plan/default-plan.ts    Kays vierdagenschema, het voorbeeld voor nieuwe bezoekers
  log/schema.ts           gelogde trainingen, die zichzelf beschrijven
  phase.ts                week, blok en lichte week op een datum
  advice.ts               wat je vandaag tilt: dubbele progressie
  plates.ts               welke schijven aan elke kant
  planner.ts              de weekindeling, met de keuze per week
src/routes/               de schermen (SvelteKit)
docs/modules/             per module een spec: waarom, scope en acceptatiecriteria
```

## Stack

SvelteKit 3 · Svelte 5 · TypeScript · Zod · Vitest · statisch gebouwd. Waarom deze keuzes: [Module 1](docs/modules/01-fundament.md). Afspraken voor wie eraan bouwt, mens of Claude Code: [CLAUDE.md](CLAUDE.md).

## Stand van zaken

1. Fundament: klaar
2. Logboek: spec klaar, wacht op akkoord
3. Zelf instellen: week, startdatum en oefeningen
4. Back-up, import en deellink, ook voor je oude log
5. Installeren en offline
6. Engels
7. Live op movva.eu

Later: een eigen huisstijl, "terug" en een comebackplan in het advies, synchroniseren met een account, functies voor trainers.

---

Gebouwd door [Kay Hardam](https://kayhardam.dev), gymleraar en handbaltrainer.
