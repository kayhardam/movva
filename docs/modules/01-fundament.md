# Module 1 — Fundament

Het logboek in claude.ai werkte, maar alles zat in één bestand: schema, rekenregels en
scherm door elkaar, met Kays schema vast in de code. Voor een app die iedereen zelf
instelt, moet de kern los staan van het scherm, en moet het schema data zijn.

Deze module bouwt die kern zonder scherm, op de stack waarop Movva verder groeit.
Hij is afgerond; deze spec legt vast wat er staat en waarom.

## Wat er staat

- `src/lib`: datums, het schema (met Kays vierdagenschema als voorbeeld), gelogde
  trainingen, fase, advies, schijven en de weekindeling. 58 tests.
- Eenmalig vergeleken met de code van het oude logboek: dezelfde week en hetzelfde blok op
  elke dag tot eind 2027, dezelfde schijven voor elk gewicht van 20 tot 300 kg, en hetzelfde
  advies in 3000 willekeurige trainingsgeschiedenissen.
- SvelteKit 3 met adapter-static, Zod, Vitest, ESLint, Prettier en CI.
- De officiële Svelte-tools voor Claude Code, zodat elke sessie de actuele documentatie heeft.
- Een tijdelijke pagina met de weekindeling en vinkjes voor handbal en wedstrijd.

## Scope-beslissingen (vastgelegd)

- **De weekregels zijn data.** "Kracht D op vrijdag als die vrij is, anders zaterdag, nooit de
  dag voor een wedstrijd" is één regel in het schema. De tabel met de vier soorten
  handbalweken uit het trainingsplan is een test.
- **Datums rekenen via UTC.** Een dag van 23 of 25 uur kan het weeknummer niet meer
  verschuiven.
- **Schijven: het kleinste aantal, in grammen.** Bezoekers geven hun eigen schijven op, en dan
  klopt "zwaarste schijf eerst" niet altijd.
- **Een gelogde training beschrijft zichzelf.** Oefeningen aanpassen laat de geschiedenis heel.
- **Advies in redenen, niet in zinnen.** Het scherm zet ze in een taal.
- **Kilo's.**
- **Nog niet:** "terug" in het advies en een comebackplan. Die komen uit movva-app, in een
  eigen module.

## Waarom deze stack

- **SvelteKit** groeit mee: nu een statische site zonder server, later met accounts en
  synchronisatie in dezelfde code, zonder herschrijven. Routes, voorgebouwde pagina's voor
  vindbaarheid en een service worker voor offline zitten erin.
- **Svelte** compileert naar kleine, gewone JavaScript: snel op een telefoon met slecht bereik,
  en de code lijkt op HTML.
- **Zod** levert de types én de controle van alles wat binnenkomt, uit één definitie.
- **Vitest** test de rekenregels los van het scherm.
