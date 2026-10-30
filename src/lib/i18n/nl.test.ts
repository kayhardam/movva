import { describe, expect, it } from 'vitest';
import { advice } from '../advice.ts';
import type { LogEntry } from '../log/schema.ts';
import { defaultPlan as plan } from '../plan/default-plan.ts';
import { planWeek } from '../planner.ts';
import { nl } from './nl.ts';

const exercise = (id: string) => plan.exercises.find((e) => e.id === id)!;

function logged(date: string, id: string, sets: [number, number][], block = 0): LogEntry {
	return {
		type: 'strength',
		id: `${date}_t`,
		date,
		session: 't',
		week: 1,
		block,
		light: false,
		exercises: [
			{ id, name: id, load: exercise(id).load, sets: sets.map(([kg, reps]) => ({ kg, reps })) }
		],
		note: '',
		updated: `${date}T18:00:00.000Z`
	};
}

const say = (id: string, date: string, history: LogEntry[], swapName?: string) =>
	nl.advice(advice(plan, exercise(id), date, history), exercise(id), swapName);

describe('Dutch copy', () => {
	it('phrases every kind of advice', () => {
		expect(say('squat', '2026-10-26', [])).toBe(
			'Eerste keer: kies een gewicht waarmee je 12 haalt, met 2–3 herhalingen over.'
		);
		expect(
			say('squat', '2026-11-02', [
				logged('2026-10-26', 'squat', [
					[60, 12],
					[60, 12],
					[60, 12]
				])
			])
		).toBe('Alle sets op 12: 2,5 kg zwaarder');
		expect(
			say('squat', '2026-11-02', [
				logged('2026-10-26', 'squat', [
					[60, 9],
					[60, 9],
					[60, 8]
				])
			])
		).toBe('Zelfde gewicht. Bouw op naar 10–12 in elke set.');
		expect(
			say('squat', '2026-12-09', [
				logged('2026-11-30', 'squat', [
					[70, 12],
					[70, 11],
					[70, 10]
				])
			])
		).toBe('Lichte week: 2 sets met 70 kg, ruim herhalingen over.');
		expect(
			say(
				'pull-up',
				'2026-11-02',
				[
					logged('2026-10-26', 'pull-up', [
						[0, 1],
						[0, 1],
						[0, 1]
					])
				],
				'Lat pulldown'
			)
		).toBe('Minder dan 5 per set. Wissel naar de lat pulldown en bouw daar op.');
	});

	it('writes weights the Dutch way, per load', () => {
		expect(nl.kgLabel('barbell', 62.5)).toBe('62,5 kg');
		expect(nl.kgLabel('dumbbell', 20)).toBe('20 kg p/st');
		expect(nl.kgLabel('bodyweight', 0)).toBe('eigen gewicht');
		expect(nl.kgLabel('bodyweight', 5)).toBe('+5 kg');
	});

	it('explains why strength D drops in a week with training and a match', () => {
		const d = planWeek(plan).dropped.find((x) => x.ref === 'd')!;
		expect(nl.week.dropped(d, 'Kracht D')).toBe(
			'Kracht D vervalt deze week: vrijdag bezet, zaterdag dag voor de wedstrijd.'
		);
	});

	it('writes dates short', () => {
		expect(nl.shortDate('2026-10-26')).toBe('ma 26 okt');
		expect(nl.dayMonth('2027-03-01')).toBe('1 mrt');
	});
});
