/**
 * Kay's four-day plan: strength around recreational handball.
 * It is the example a visitor starts from, and the plan the old logbook ran on.
 */
import { Plan, type PlanInput } from './schema'

const WARM_UP =
  '10 minuten eigen warming-up: inlopen, zijwaartse passen, sprints die steeds iets harder gaan, 2 × 15 externe rotatie met elastiek en rustig inwerpen.'

const plan = {
  v: 1,
  name: 'Vierdagenschema handbal',
  start: '2026-10-26',
  restDays: [2],
  week: [
    { refs: ['a'], days: [0] },
    { refs: ['b'], days: [1] },
    { refs: ['c'], days: [3] },
    { refs: ['handbal'], days: [4], optional: true },
    { refs: ['wedstrijd'], days: [6], optional: true },
    // Friday if that's free, otherwise Saturday, but never the day before a match.
    { refs: ['d'], days: [4, 5], notBeforeMatch: true },
    // Conditioning only in a week without handball.
    { refs: ['intervallen', 'hardlopen'], days: [6], onlyWithoutSport: true },
  ],
  sessions: [
    {
      id: 'a',
      label: 'A',
      name: 'Squat',
      exercises: ['squat', 'bench-press', 'pull-up', 'leg-curl', 'barbell-curl', 'calf-raise'],
    },
    {
      id: 'b',
      label: 'B',
      name: 'Deadlift',
      exercises: [
        'romanian-deadlift',
        'overhead-press',
        'dumbbell-row',
        'bulgarian-split-squat',
        'calf-raise',
      ],
    },
    {
      id: 'c',
      label: 'C',
      name: 'Bovenlichaam',
      exercises: ['incline-bench-press', 'chin-up', 'lateral-raise', 'reverse-fly', 'roll-out'],
      note: 'Begin met 2 × 15 externe rotatie met een elastiek.',
    },
    {
      id: 'd',
      label: 'D',
      name: 'Extra',
      exercises: [
        'hip-thrust',
        'close-grip-bench-press',
        'cable-row',
        'leg-extension',
        'lateral-raise',
        'hammer-curl',
      ],
    },
  ],
  activities: [
    {
      id: 'handbal',
      label: 'H',
      name: 'Handbal',
      kind: 'sport',
      detail: '18:30–20:00',
      minutes: 90,
      tips: [
        WARM_UP,
        'De eerste zes weken: speel op 70 tot 80%, zonder volle sprints of maximale sprongen.',
        'Kuiten stijf of gespannen? Doe rustig aan.',
      ],
    },
    {
      id: 'wedstrijd',
      label: 'W',
      name: 'Wedstrijd',
      kind: 'match',
      detail: '2 × 20 min',
      minutes: 40,
      tips: [
        WARM_UP,
        'De eerste zes weken: speel op 70 tot 80% en wissel vaak.',
        'Benen maandag nog zwaar? Houd dan bij de squat 3 herhalingen over.',
      ],
    },
    {
      id: 'intervallen',
      label: 'I',
      name: 'Intervallen',
      kind: 'cardio',
      detail: '4 × 4 min',
      minutes: 40,
      tips: [
        'Week 1 tot 3: 3 blokken van 3 minuten, net onder je maximum. Daarna 4 blokken van 4 minuten, in een lichte week 3.',
        '10 minuten inrijden, 3 minuten rustig tussen de blokken, 5 tot 10 minuten uitfietsen.',
        'In de blokken lukt praten niet meer, maar je houdt het tempo vol.',
        'Op de fiets of hometrainer; later ook lopend bergop, als hardlopen goed gaat.',
        'Moe of slecht geslapen? Doe 3 blokken in plaats van 4.',
      ],
    },
    {
      id: 'hardlopen',
      label: 'L',
      name: 'Hardlopen',
      kind: 'cardio',
      detail: 'Rustig',
      minutes: 30,
      tips: [
        'Op praattempo; begin en eindig met 5 minuten wandelen.',
        'Stap 1: 8 × 1 min lopen, 1 min wandelen.',
        'Stap 2: 6 × 2 min lopen, 1 min wandelen.',
        'Stap 3: 4 × 4 min lopen, 1 min wandelen.',
        'Stap 4: 2 × 10 min lopen, 2 min wandelen.',
        'Stap 5: 25 tot 30 minuten aan één stuk.',
        'Elke stap minstens 2 keer, en pas verder als het zonder pijntjes ging. Pijntje in een pees? Fiets dan, zelfde tijd.',
      ],
    },
  ],
  exercises: [
    { id: 'squat', name: 'Back squat', role: 'main', load: 'barbell', step: 2.5, tip: 'Rug recht; zo diep als je technisch goed kunt.' },
    { id: 'bench-press', name: 'Bench press', role: 'main', load: 'barbell', step: 2.5, tip: 'Voeten plat, billen op de bank, schouderbladen samen.' },
    { id: 'pull-up', name: 'Pull-up', role: 'main', load: 'bodyweight', step: 2.5, swap: 'lat-pulldown', tip: 'Helemaal uithangen. Extra gewicht pas als je in alle sets de bovenkant haalt.' },
    { id: 'lat-pulldown', name: 'Lat pulldown', role: 'main', load: 'weight', step: 2.5, swap: 'pull-up', tip: 'Brede greep, borst vooruit, stang naar je bovenborst.' },
    { id: 'leg-curl', name: 'Leg curl', role: 'accessory', load: 'weight', step: 2.5, tip: 'Langzaam terug, niet laten vallen.' },
    { id: 'barbell-curl', name: 'Barbell curl', role: 'accessory', load: 'weight', step: 2.5, tip: 'Ellebogen stil, niet zwaaien.' },
    { id: 'calf-raise', name: 'Staande kuitheffing', role: 'accessory', load: 'weight', step: 2.5, tip: 'Onderin 1 seconde pauze, niet veren; dat spaart je achillespees.' },
    { id: 'romanian-deadlift', name: 'Romanian deadlift', role: 'main', load: 'barbell', step: 2.5, tip: 'Heupen naar achteren, stang langs je benen; rug recht.' },
    { id: 'overhead-press', name: 'Overhead press', role: 'main', load: 'barbell', step: 2.5, tip: 'Staand. Billen en buik aan; stang in een rechte lijn omhoog.' },
    { id: 'dumbbell-row', name: 'Eenarmige dumbbell row', role: 'main', load: 'dumbbell', step: 2, side: 'arm', tip: 'Hand en knie op de bank; elleboog naar je heup.' },
    { id: 'bulgarian-split-squat', name: 'Bulgarian split squat', role: 'main', load: 'dumbbell', step: 2, side: 'leg', tip: 'Bovenlichaam recht; zwakste been eerst. Helpt bij afremmen en landen.' },
    { id: 'incline-bench-press', name: 'Incline bench press', role: 'main', load: 'barbell', step: 2.5, tip: 'Met de stang. Bank op ongeveer 30 graden, stang naar je bovenborst.' },
    { id: 'chin-up', name: 'Chin-up', role: 'main', load: 'bodyweight', step: 2.5, swap: 'lat-pulldown-underhand', tip: 'Helemaal uithangen. Extra gewicht pas als je in alle sets de bovenkant haalt.' },
    { id: 'lat-pulldown-underhand', name: 'Lat pulldown onderhands', role: 'main', load: 'weight', step: 2.5, swap: 'chin-up', tip: 'Handen op schouderbreedte, handpalmen naar je toe.' },
    { id: 'lateral-raise', name: 'Dumbbell lateral raise', role: 'accessory', load: 'dumbbell', step: 1, tip: 'Licht gewicht, ellebogen licht gebogen.' },
    { id: 'reverse-fly', name: 'Reverse fly', role: 'accessory', load: 'dumbbell', step: 1, tip: 'Voorovergebogen, licht gewicht, niet zwaaien.' },
    { id: 'roll-out', name: 'Roll-outs', role: 'accessory', load: 'reps', tip: 'Vanaf je knieën, zoveel als technisch goed lukt; stop als je onderrug doorzakt.' },
    { id: 'hip-thrust', name: 'Hip thrust', role: 'main', load: 'barbell', step: 2.5, tip: 'Kin naar de borst; boven 1 seconde vasthouden.' },
    { id: 'close-grip-bench-press', name: 'Close-grip bench press', role: 'main', load: 'barbell', step: 2.5, tip: 'Handen op schouderbreedte, ellebogen dicht langs je lichaam.' },
    { id: 'cable-row', name: 'Seated cable row', role: 'main', load: 'weight', step: 2.5, tip: 'Rechtop, borst vooruit.' },
    { id: 'leg-extension', name: 'Leg extension', role: 'accessory', load: 'weight', step: 2.5, tip: 'Boven kort vasthouden, langzaam zakken.' },
    { id: 'hammer-curl', name: 'Hammer curl', role: 'accessory', load: 'dumbbell', step: 1, tip: 'Duimen omhoog, ellebogen stil.' },
    { id: 'back-extension', name: 'Back extension', role: 'accessory', load: 'bodyweight', step: 2.5, tip: 'Omhoog tot je lichaam recht is, niet verder doorbuigen.' },
  ],
  blocks: [
    { name: 'Basis', weeks: 6, main: [10, 12], accessory: [12, 15], rir: [2, 3], deload: true },
    { name: 'Opbouw', weeks: 6, main: [8, 10], accessory: [12, 15], rir: [2, 2], deload: true },
    { name: 'Kracht', weeks: 6, main: [6, 8], accessory: [10, 12], rir: [1, 2], deload: true },
  ],
  sets: { normal: 3, light: 2 },
  equipment: { bar: 20, plates: [25, 20, 15, 10, 5, 2.5, 1.25] },
} satisfies PlanInput

/** Checked when the module loads: a broken default plan fails loudly, in the tests first. */
export const defaultPlan: Plan = Plan.parse(plan)
