import { describe, expect, it } from 'vitest';
import { addDays, daysBetween, isIsoDate, mondayOf, today, weekday } from './dates.ts';

describe('dates', () => {
	it('runs in Dutch time, so the clock changes below are real', () => {
		expect(new Date(2027, 2, 27, 12).getTimezoneOffset()).toBe(-60); // CET
		expect(new Date(2027, 2, 28, 12).getTimezoneOffset()).toBe(-120); // CEST
	});

	it('only accepts real calendar days', () => {
		expect(isIsoDate('2026-10-26')).toBe(true);
		expect(isIsoDate('2028-02-29')).toBe(true);
		expect(isIsoDate('2027-02-29')).toBe(false);
		expect(isIsoDate('2026-13-01')).toBe(false);
		expect(isIsoDate('26-10-2026')).toBe(false);
		expect(isIsoDate('2026-10-26T00:00')).toBe(false);
	});

	it('knows the weekdays, Monday first', () => {
		expect(weekday('2026-10-26')).toBe(0); // the Monday the plan started
		expect(weekday('2026-10-28')).toBe(2); // Wednesday, the rest day
		expect(weekday('2026-11-01')).toBe(6); // Sunday
		expect(mondayOf('2026-11-01')).toBe('2026-10-26');
		expect(mondayOf('2026-10-26')).toBe('2026-10-26');
	});

	it('adds days across months and years', () => {
		expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
		expect(addDays('2026-10-26', 21 * 7)).toBe('2027-03-22');
		expect(addDays('2027-03-01', -1)).toBe('2027-02-28');
	});

	it('counts whole days across the switch to summer time', () => {
		// Summer time starts on Sunday 28 March 2027, so that day lasts 23 hours.
		const naive = (+new Date(2027, 2, 29) - +new Date(2026, 9, 26)) / 86_400_000;
		expect(naive).toBeCloseTo(153.958, 3); // dividing local milliseconds comes out short
		expect(Math.floor(naive / 7) + 1).toBe(22); // so Monday 29 March would land in the wrong week
		expect(daysBetween('2026-10-26', '2027-03-29')).toBe(154);
		expect(daysBetween('2027-03-29', '2026-10-26')).toBe(-154);
	});

	it('takes today from the local clock', () => {
		expect(today(new Date(2026, 9, 30, 23, 30))).toBe('2026-10-30');
		expect(today(new Date(2026, 9, 31, 0, 15))).toBe('2026-10-31');
	});
});
