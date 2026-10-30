import { describe, expect, it } from 'vitest';
import { LogEntry } from './schema.ts';

const squatDay = {
	type: 'strength',
	id: '2026-10-26_a',
	date: '2026-10-26',
	session: 'a',
	week: 1,
	block: 0,
	light: false,
	exercises: [
		{
			id: 'squat',
			name: 'Back squat',
			load: 'barbell',
			sets: [
				{ kg: 60, reps: 12 },
				{ kg: 60, reps: 11 }
			]
		}
	],
	updated: '2026-10-26T19:04:00.000Z'
};

describe('log entries', () => {
	it('accepts a logged training and fills in an empty note', () => {
		const result = LogEntry.safeParse(squatDay);
		expect(result.success && result.data.note).toBe('');
	});

	it('keeps the id tied to the date and session', () => {
		expect(LogEntry.safeParse({ ...squatDay, id: '2026-10-27_a' }).success).toBe(false);
	});

	it('refuses sets that cannot be real', () => {
		const exercise = squatDay.exercises[0]!;
		const withSets = (sets: unknown) => ({ ...squatDay, exercises: [{ ...exercise, sets }] });
		expect(LogEntry.safeParse(withSets([{ kg: 60, reps: 0 }])).success).toBe(false);
		expect(LogEntry.safeParse(withSets([{ kg: 1000, reps: 5 }])).success).toBe(false);
		expect(LogEntry.safeParse(withSets([{ kg: null, reps: 15 }])).success).toBe(true);
	});

	it('tells activities and strength apart by type', () => {
		const match = {
			type: 'activity',
			id: '2026-11-01_wedstrijd',
			date: '2026-11-01',
			activity: 'wedstrijd',
			name: 'Wedstrijd',
			minutes: 40,
			week: 1,
			block: 0,
			light: false,
			updated: '2026-11-01T15:00:00.000Z'
		};
		expect(LogEntry.safeParse(match).success).toBe(true);
		expect(LogEntry.safeParse({ ...match, type: 'strength' }).success).toBe(false);
	});
});
