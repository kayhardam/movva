/**
 * Progress per exercise and the sport and conditioning of the last weeks,
 * read from the log alone.
 */
import { addDays, type IsoDate } from './dates.ts';
import type { LogEntry, SetRow } from './log/schema.ts';
import type { Activity, Load, Plan } from './plan/schema.ts';

export interface ExerciseProgress {
	id: string;
	name: string;
	load: Load;
	role: 'main' | 'accessory';
	/** Working weight per session (the first set), or the best set for reps-only exercises. */
	points: { date: IsoDate; value: number }[];
	last: { date: IsoDate; sets: SetRow[] } | null;
	/** Last value minus the first. */
	change: number;
}

/**
 * Every exercise in the plan's sessions in session order, then anything else
 * you logged. Names come from the log when the plan no longer has the exercise.
 */
export function exerciseProgress(plan: Plan, entries: readonly LogEntry[]): ExerciseProgress[] {
	const order: string[] = [];
	for (const session of plan.sessions)
		for (const id of session.exercises) if (!order.includes(id)) order.push(id);

	const logged = new Map<
		string,
		{ name: string; load: Load; points: ExerciseProgress['points']; last: ExerciseProgress['last'] }
	>();
	for (const entry of entries) {
		if (entry.type !== 'strength') continue;
		for (const done of entry.exercises) {
			const best = Math.max(...done.sets.map((s) => s.reps));
			const value = done.load === 'reps' ? best : (done.sets[0]?.kg ?? 0);
			const item = logged.get(done.id) ?? {
				name: done.name,
				load: done.load,
				points: [],
				last: null
			};
			item.points.push({ date: entry.date, value });
			item.last = { date: entry.date, sets: done.sets };
			logged.set(done.id, item);
			if (!order.includes(done.id)) order.push(done.id);
		}
	}

	return order.flatMap((id): ExerciseProgress[] => {
		const planned = plan.exercises.find((e) => e.id === id);
		const item = logged.get(id);
		if (!planned && !item) return [];
		const points = item?.points ?? [];
		const first = points[0]?.value ?? 0;
		const lastValue = points.at(-1)?.value ?? 0;
		return [
			{
				id,
				name: planned?.name ?? item?.name ?? id,
				load: planned?.load ?? item?.load ?? 'weight',
				role: planned?.role ?? 'accessory',
				points,
				last: item?.last ?? null,
				change: Math.round((lastValue - first) * 100) / 100
			}
		];
	});
}

export interface ActivityTotal {
	activity: Activity;
	count: number;
	minutes: number;
}

/** How often and how long each activity was done in the last `days` days, today included. */
export function activityTotals(
	plan: Plan,
	entries: readonly LogEntry[],
	today: IsoDate,
	days = 28
): ActivityTotal[] {
	const from = addDays(today, -(days - 1));
	return plan.activities.map((activity) => {
		const done = entries.filter(
			(e) =>
				e.type === 'activity' && e.activity === activity.id && e.date >= from && e.date <= today
		);
		const minutes = done.reduce((sum, e) => sum + (e.type === 'activity' ? e.minutes : 0), 0);
		return { activity, count: done.length, minutes };
	});
}
