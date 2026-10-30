import { describe, expect, it } from 'vitest';
import type { LogEntry } from './log/schema.ts';
import { defaultPlan as plan } from './plan/default-plan.ts';
import {
	buildForm,
	defaultRef,
	formatKg,
	loggedPerDay,
	parseKg,
	parseMinutes,
	parseReps,
	setKg,
	swapExercise,
	toEntry,
	type Form,
	type StrengthForm
} from './session.ts';

const NOW = new Date('2026-11-02T19:00:00.000Z');

/** Fill a form the way you would on the phone: one exercise, given rows of [kg, reps]. */
function fill(form: Form | null, exerciseId: string, rows: [string, string][]): StrengthForm {
	if (form?.kind !== 'strength') throw new Error('Expected a strength form');
	return {
		...form,
		exercises: form.exercises.map((x) =>
			x.exercise.id === exerciseId ? { ...x, rows: rows.map(([kg, reps]) => ({ kg, reps })) } : x
		)
	};
}

function save(form: Form, history: LogEntry[] = []): LogEntry[] {
	const entry = toEntry(plan, form, NOW);
	if (!entry) throw new Error('Nothing to save');
	return [...history.filter((e) => e.id !== entry.id), entry];
}

describe('numbers as people type them', () => {
	it('reads weights with a comma or a dot', () => {
		expect(parseKg('62,5')).toBe(62.5);
		expect(parseKg(' 62.5 ')).toBe(62.5);
		expect(parseKg('')).toBeNull();
		expect(parseKg('veel')).toBeNull();
		expect(parseKg('1200')).toBe(999);
		expect(formatKg(62.5)).toBe('62,5');
		expect(formatKg(60)).toBe('60');
	});

	it('reads reps and minutes as whole numbers', () => {
		expect([parseReps('12'), parseReps('0'), parseReps(''), parseReps('150')]).toEqual([
			12, 0, 0, 99
		]);
		expect([parseMinutes('90'), parseMinutes('-5'), parseMinutes('900')]).toEqual([90, 0, 600]);
	});
});

describe('which training a day shows', () => {
	it('follows the week plan', () => {
		expect(defaultRef(plan, '2026-11-02', [])).toBe('a'); // Monday
		expect(defaultRef(plan, '2026-11-06', [])).toBe('handbal'); // Friday
		expect(defaultRef(plan, '2026-11-06', [], ['handbal'])).toBe('d'); // no handball this week
	});

	it("shows tomorrow's session on the rest day", () => {
		expect(defaultRef(plan, '2026-11-04', [])).toBe('c'); // Wednesday → Thursday
	});

	it('shows what you logged that day, even if the plan says otherwise', () => {
		const history = save(
			fill(buildForm(plan, '2026-11-02', 'b', []), 'romanian-deadlift', [['60', '10']])
		);
		expect(defaultRef(plan, '2026-11-02', history)).toBe('b');
	});
});

describe('the form', () => {
	it("starts empty the first time, with the plan's number of sets", () => {
		const form = buildForm(plan, '2026-10-26', 'a', []);
		expect(form?.kind === 'strength' && form.exercises.map((x) => x.exercise.id)).toEqual(
			plan.sessions[0]?.exercises
		);
		expect(form?.kind === 'strength' && form.exercises[0]?.rows).toEqual([
			{ kg: '', reps: '' },
			{ kg: '', reps: '' },
			{ kg: '', reps: '' }
		]);
	});

	it('fills in the next weight once every set reached the top', () => {
		const history = save(
			fill(buildForm(plan, '2026-10-26', 'a', []), 'squat', [
				['60', '12'],
				['60', '12'],
				['60', '12']
			])
		);
		const next = buildForm(plan, '2026-11-02', 'a', history);
		const squat = next?.kind === 'strength' ? next.exercises[0] : undefined;
		expect(squat?.advice.kind).toBe('up');
		expect(squat?.rows.map((r) => r.kg)).toEqual(['62,5', '62,5', '62,5']);
	});

	it('shows two sets in a light week', () => {
		const form = buildForm(plan, '2026-12-07', 'a', []);
		expect(form?.kind === 'strength' && form.exercises[0]?.rows).toHaveLength(2);
	});

	it('reopens a logged training as you left it', () => {
		const history = save(
			fill(buildForm(plan, '2026-10-26', 'a', []), 'squat', [
				['60', '12'],
				['60', '11'],
				['60', '10'],
				['60', '8']
			])
		);
		const again = buildForm(plan, '2026-10-26', 'a', history);
		expect(again?.kind === 'strength' && again.exercises[0]?.rows.map((r) => r.reps)).toEqual([
			'12',
			'11',
			'10',
			'8'
		]);
	});

	it('keeps the lat pulldown once you switched to it', () => {
		const first = buildForm(plan, '2026-10-26', 'a', []);
		if (first?.kind !== 'strength') throw new Error('strength form expected');
		const swapped = swapExercise(plan, first, 'pull-up', []);
		expect(swapped.exercises.map((x) => x.exercise.id)).toContain('lat-pulldown');
		const history = save(fill(swapped, 'lat-pulldown', [['40', '10']]));
		const next = buildForm(plan, '2026-11-02', 'a', history);
		expect(next?.kind === 'strength' && next.exercises.map((x) => x.exercise.id)).toContain(
			'lat-pulldown'
		);
	});

	it('copies the weight of set 1 to the sets you have not done yet', () => {
		const rows = [
			{ kg: '60', reps: '12' },
			{ kg: '60', reps: '' },
			{ kg: '55', reps: '' }
		];
		expect(setKg(rows, 0, '62,5')).toEqual([
			{ kg: '62,5', reps: '12' },
			{ kg: '62,5', reps: '' },
			{ kg: '55', reps: '' }
		]);
		expect(setKg(rows, 2, '50')[1]?.kg).toBe('60');
	});
});

describe('saving', () => {
	it('keeps only sets with reps, and reads Dutch decimals', () => {
		const form = fill(buildForm(plan, '2026-11-02', 'a', []), 'squat', [
			['62,5', '12'],
			['62,5', ''],
			['', '']
		]);
		const entry = toEntry(plan, form, NOW);
		expect(entry).toMatchObject({
			id: '2026-11-02_a',
			type: 'strength',
			week: 2,
			block: 0,
			light: false,
			exercises: [{ id: 'squat', name: 'Back squat', sets: [{ kg: 62.5, reps: 12 }] }]
		});
	});

	it('logs bodyweight without a weight as 0, and roll-outs without one at all', () => {
		const form = fill(
			fill(buildForm(plan, '2026-10-29', 'c', []), 'chin-up', [['', '3']]),
			'roll-out',
			[['', '8']]
		);
		const entry = toEntry(plan, form, NOW);
		expect(entry?.type === 'strength' && entry.exercises.map((x) => x.sets[0]?.kg)).toEqual([
			0,
			null
		]);
	});

	it('returns nothing for an empty form, so the day is cleared', () => {
		expect(toEntry(plan, buildForm(plan, '2026-11-02', 'a', [])!, NOW)).toBeNull();
	});

	it('logs an activity with its minutes and note', () => {
		const form = buildForm(plan, '2026-11-06', 'handbal', []);
		if (form?.kind !== 'activity') throw new Error('activity form expected');
		const entry = toEntry(plan, { ...form, minutes: '90', note: ' Kuiten stijf ' }, NOW);
		expect(entry).toMatchObject({
			type: 'activity',
			activity: 'handbal',
			minutes: 90,
			note: 'Kuiten stijf'
		});
		expect(toEntry(plan, form, NOW)).toBeNull();
	});

	it('groups the log per day of the week', () => {
		const history = save(
			fill(buildForm(plan, '2026-11-03', 'b', []), 'romanian-deadlift', [['60', '10']])
		);
		expect(loggedPerDay(history, '2026-11-02').map((day) => day.length)).toEqual([
			0, 1, 0, 0, 0, 0, 0
		]);
	});
});
