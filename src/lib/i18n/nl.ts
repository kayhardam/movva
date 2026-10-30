/**
 * Every text on screen, in Dutch. English (module 6) gets the same shape,
 * typed as `Copy`, so a missing text fails `npm run check`.
 */
import type { Advice } from '../advice.ts';
import { weekday, type IsoDate } from '../dates.ts';
import type { SetRow } from '../log/schema.ts';
import type { DayBlock, Dropped } from '../planner.ts';
import type { Exercise, Load, Range } from '../plan/schema.ts';
import { formatKg } from '../session.ts';

const DAYS = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];
const DAY_NAMES = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'];
const MONTHS = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

const range = ([lo, hi]: Range) => (lo === hi ? `${lo}` : `${lo}–${hi}`);

/** "26 okt" */
function dayMonth(date: IsoDate): string {
	const [, m, d] = date.split('-').map(Number);
	return `${d} ${MONTHS[(m ?? 1) - 1]}`;
}

/** "ma 26 okt" */
function shortDate(date: IsoDate): string {
	return `${DAYS[weekday(date)]} ${dayMonth(date)}`;
}

/** "62,5 kg", "20 kg p/st", "+5 kg" or "eigen gewicht", depending on the load. */
function kgLabel(load: Load, kg: number): string {
	if (load === 'bodyweight') return kg > 0 ? `+${formatKg(kg)} kg` : 'eigen gewicht';
	return `${formatKg(kg)} kg${load === 'dumbbell' ? ' p/st' : ''}`;
}

/** "60 kg × 12 · 11 · 10", "60×12 · 57,5×12" or "8 · 10 · 9 herh.": a session's sets on one line. */
function setsText(load: Load, sets: readonly SetRow[]): string {
	const reps = sets.map((s) => s.reps).join(' · ');
	if (load === 'reps') return `${reps} herh.`;
	const first = sets[0]?.kg ?? 0;
	if (sets.every((s) => (s.kg ?? 0) === first)) return `${kgLabel(load, first)} × ${reps}`;
	return sets.map((s) => `${formatKg(s.kg ?? 0)}×${s.reps}`).join(' · ');
}

/** The advice as a sentence. `swapName` is the name of the exercise to switch to. */
function advice(a: Advice, exercise: Exercise, swapName = ''): string {
	const { sets, reps, rir } = a.target;
	switch (a.kind) {
		case 'start':
			if (exercise.load === 'reps') return 'Eerste keer: zoveel als technisch goed lukt.';
			if (exercise.load === 'bodyweight') return 'Eerste keer: begin zonder extra gewicht.';
			return `Eerste keer: kies een gewicht waarmee je ${reps[1]} haalt, met ${range(rir)} herhalingen over.`;
		case 'light':
			if (a.kg === null) return `Lichte week: ${sets} rustige sets.`;
			return `Lichte week: ${sets} sets met ${kgLabel(exercise.load, a.kg)}, ruim herhalingen over.`;
		case 'up':
			return a.why === 'new-block'
				? 'Nieuw blok: ongeveer 5 tot 10% zwaarder'
				: `Alle sets op ${reps[1]}: ${formatKg(exercise.step)} kg zwaarder`;
		case 'swap':
			return `Minder dan 5 per set. Wissel naar de ${swapName.toLowerCase()} en bouw daar op.`;
		case 'hold':
			if (a.why === 'reps-only')
				return `Vorige beste set: ${a.best}. Eén meer mag, als de techniek goed blijft.`;
			if (a.why === 'new-block')
				return `Nieuw blok: ${range(reps)} herhalingen. Haal je ${reps[1]} in alle sets, hang er dan ${formatKg(exercise.step)} kg aan.`;
			return a.why === 'reach-range'
				? `Zelfde gewicht. Bouw op naar ${range(reps)} in elke set.`
				: `Zelfde gewicht. Werk toe naar ${reps[1]} in alle sets.`;
	}
}

const BLOCKED: Record<DayBlock, string> = {
	busy: 'bezet',
	'before-match': 'dag voor de wedstrijd'
};

/** Why something from the plan isn't in this week. */
function dropped(d: Dropped, name: string): string {
	if (d.why === 'skipped') return `${name}: niet deze week.`;
	if (d.why === 'sport-this-week') return `${name}: niet nodig, je sport deze week al.`;
	const reasons = d.tried.map((t) => `${DAY_NAMES[t.day]} ${BLOCKED[t.why]}`).join(', ');
	return `${name} vervalt deze week: ${reasons}.`;
}

export const nl = {
	lang: 'nl',
	app: {
		name: 'Movva',
		tagline: 'Wedstrijdsport en kracht'
	},
	status: {
		loading: 'Laden…',
		ready: 'Klaar',
		dirty: 'Wijziging…',
		saving: 'Opslaan…',
		saved: 'Bewaard',
		error: 'Niet bewaard, tik om opnieuw',
		memory: 'Niet bewaard'
	},
	memoryNotice:
		'Deze browser staat opslaan niet toe, bijvoorbeeld in een privévenster. Wat je logt, is weg als je de pagina sluit.',
	wake: 'Scherm aan',
	phase: {
		week: 'Week',
		block: (n: number, name: string) => `Blok ${n} – ${name}`,
		light: 'Lichte week',
		sameWeight: 'zelfde gewicht als vorige week',
		main: 'Basis',
		accessory: 'Hulp',
		rir: 'Herh. over',
		plenty: 'ruim',
		before: (date: IsoDate) => `Het schema begint op ${shortDate(date)}.`,
		after: 'Het schema is rond; je gaat door in het laatste blok.'
	},
	week: {
		label: 'Deze week',
		choices: 'Doe je mee deze week?',
		rest: 'rust',
		nothing: 'niets gelogd',
		planned: 'gepland',
		dropped
	},
	tabs: { training: 'Training', progress: 'Voortgang' },
	training: {
		date: 'Datum',
		pick: 'Kies je training',
		sets: (n: number, reps: string, side: string) => `${n} × ${reps}${side}`,
		perSide: { arm: ' per arm', leg: ' per been' } as Record<'arm' | 'leg', string>,
		over: (rir: Range | null) => (rir ? `${range(rir)} over` : 'ruim over'),
		max: 'max',
		last: 'Vorige',
		set: 'Set',
		reps: 'Herh.',
		unit: {
			barbell: 'Kg',
			dumbbell: 'Kg p/st',
			weight: 'Kg',
			bodyweight: 'Extra kg',
			reps: ''
		} as Record<Load, string>,
		main: 'Basis',
		accessory: 'Hulp',
		plates: 'Per kant',
		barOnly: 'Alleen de stang',
		bar: (kg: number) => `stang ${formatKg(kg)} kg`,
		missing: (kg: number) => `+ ${formatKg(kg)} kg`,
		swapTo: (name: string) => `Wissel naar ${name.toLowerCase()}`,
		minutes: 'Minuten',
		note: 'Notitie',
		notePlaceholder: 'Bijvoorbeeld: elleboog voelde stijf bij de curls.',
		remove: 'Deze training wissen',
		removeAsk: 'Deze training wissen?',
		removeYes: 'Wissen',
		cancel: 'Annuleren',
		restDay: 'Vandaag is een rustdag. Hieronder staat je volgende training.'
	},
	progress: {
		main: 'Basisoefeningen',
		accessory: 'Hulpoefeningen',
		activities: 'Sport en conditie, laatste 4 weken',
		history: 'Gelogde trainingen',
		emptyTitle: 'Nog niets gelogd',
		emptyText:
			'Na je eerste training zie je hier per oefening je werkgewicht, je laatste sets en hoeveel je sinds de start vooruit bent gegaan.',
		notYet: 'Nog niet gelogd',
		first: (date: IsoDate) => `Eerste keer op ${shortDate(date)}`,
		same: (date: IsoDate) => `Gelijk sinds ${shortDate(date)}`,
		change: (up: boolean, amount: string, date: IsoDate) =>
			`${up ? '▲' : '▼'} ${amount} sinds ${shortDate(date)}`,
		times: (n: number) => `${n}×`,
		minutes: (n: number) => `${n} min`,
		sets: (n: number) => `${n} sets`,
		light: 'lichte week'
	},
	footer: {
		weights:
			'Stang: vul het totaal in, met de stang erbij. Dumbbells: het gewicht per dumbbell. Pull-ups en chin-ups: het extra gewicht, 0 is je eigen gewicht.',
		local: 'Alles wat je logt, blijft in deze browser. Er is geen account en geen server.'
	},
	kind: { sport: 'Sport', match: 'Wedstrijd', cardio: 'Conditie' } as Record<
		'sport' | 'match' | 'cardio',
		string
	>,
	strength: (label: string) => `Kracht ${label}`,
	loggedThisWeek: 'gelogd deze week',
	madeBy: 'Gemaakt door',
	days: DAYS,
	range,
	dayMonth,
	shortDate,
	kgLabel,
	setsText,
	advice
};

export type Copy = typeof nl;
