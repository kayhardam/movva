import { describe, expect, it } from 'vitest';
import type { LogEntry } from './log/schema.ts';
import { defaultPlan as plan } from './plan/default-plan.ts';
import { activityTotals, exerciseProgress } from './progress.ts';

function lift(date: string, id: string, name: string, kg: number | null, reps: number[]): LogEntry {
	return {
		type: 'strength',
		id: `${date}_a`,
		date,
		session: 'a',
		week: 1,
		block: 0,
		light: false,
		exercises: [
			{ id, name, load: kg === null ? 'reps' : 'barbell', sets: reps.map((r) => ({ kg, reps: r })) }
		],
		note: '',
		updated: `${date}T18:00:00.000Z`
	};
}

function sport(date: string, activity: string, minutes: number): LogEntry {
	return {
		type: 'activity',
		id: `${date}_${activity}`,
		date,
		activity,
		name: activity,
		minutes,
		week: 1,
		block: 0,
		light: false,
		note: '',
		updated: `${date}T18:00:00.000Z`
	};
}

describe('progress', () => {
	it('follows the working weight of an exercise', () => {
		const history = [
			lift('2026-10-26', 'squat', 'Back squat', 60, [12, 12, 12]),
			lift('2026-11-02', 'squat', 'Back squat', 62.5, [12, 11, 10])
		];
		const squat = exerciseProgress(plan, history).find((p) => p.id === 'squat');
		expect(squat).toMatchObject({
			points: [
				{ date: '2026-10-26', value: 60 },
				{ date: '2026-11-02', value: 62.5 }
			],
			change: 2.5,
			last: { date: '2026-11-02' }
		});
	});

	it('counts the best set for reps-only exercises', () => {
		const history = [lift('2026-10-29', 'roll-out', 'Roll-outs', null, [8, 10, 9])];
		expect(exerciseProgress(plan, history).find((p) => p.id === 'roll-out')?.points).toEqual([
			{ date: '2026-10-29', value: 10 }
		]);
	});

	it('lists every exercise of the plan, logged or not, then what the plan no longer has', () => {
		const history = [lift('2026-10-26', 'kettlebell-swing', 'Kettlebell swing', 16, [15])];
		const all = exerciseProgress(plan, history);
		expect(all[0]?.id).toBe('squat');
		expect(all.at(-1)).toMatchObject({ id: 'kettlebell-swing', name: 'Kettlebell swing' });
	});

	it('adds up sport and conditioning over the last four weeks', () => {
		const history = [
			sport('2026-10-02', 'handbal', 90), // too long ago
			sport('2026-10-30', 'handbal', 90),
			sport('2026-11-01', 'wedstrijd', 40),
			sport('2026-11-06', 'handbal', 85)
		];
		const totals = activityTotals(plan, history, '2026-11-06');
		expect(totals.map((t) => [t.activity.id, t.count, t.minutes])).toEqual([
			['handbal', 2, 175],
			['wedstrijd', 1, 40],
			['intervallen', 0, 0],
			['hardlopen', 0, 0]
		]);
	});
});
