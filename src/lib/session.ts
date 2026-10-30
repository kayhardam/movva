/**
 * One training on one day: which one it is, the form you fill in, and the log
 * entry it becomes. Pure functions, so the screens only show and store.
 */
import { advice, type Advice } from './advice.ts';
import { addDays, weekday, type IsoDate } from './dates.ts';
import { entryId, LogEntry, type StrengthEntry } from './log/schema.ts';
import { phaseOf } from './phase.ts';
import type { Exercise, Plan } from './plan/schema.ts';
import { planWeek } from './planner.ts';

/** What you type, kept as text until saving, so "62," halfway through typing survives. */
export interface SetInput {
	kg: string;
	reps: string;
}

export interface ExerciseForm {
	exercise: Exercise;
	advice: Advice;
	rows: SetInput[];
}

export interface StrengthForm {
	kind: 'strength';
	id: string;
	date: IsoDate;
	ref: string;
	exercises: ExerciseForm[];
	note: string;
}

export interface ActivityForm {
	kind: 'activity';
	id: string;
	date: IsoDate;
	ref: string;
	minutes: string;
	note: string;
}

export type Form = StrengthForm | ActivityForm;

// ---------- numbers as people type them ----------

/** 62.5 → "62,5": Dutch decimals. */
export function formatKg(kg: number): string {
	return String(Math.round(kg * 100) / 100).replace('.', ',');
}

/** "62,5" and "62.5" both mean 62.5; empty or nonsense means nothing. */
export function parseKg(text: string): number | null {
	const value = Number.parseFloat(text.trim().replace(',', '.'));
	return Number.isFinite(value) ? Math.min(Math.max(value, 0), 999) : null;
}

/** Whole reps from 1 to 99; anything else counts as "not done". */
export function parseReps(text: string): number {
	const value = Number.parseInt(text.trim(), 10);
	return Number.isFinite(value) && value > 0 ? Math.min(value, 99) : 0;
}

/** Whole minutes from 1 to 600; anything else counts as "not filled in". */
export function parseMinutes(text: string): number {
	const value = Number.parseInt(text.trim(), 10);
	return Number.isFinite(value) && value > 0 ? Math.min(value, 600) : 0;
}

// ---------- which training ----------

function refOf(entry: LogEntry): string {
	return entry.type === 'strength' ? entry.session : entry.activity;
}

/**
 * The training to show for a date: what you already logged that day, otherwise
 * what the week plan puts there, otherwise the next thing coming up (so the
 * rest day already shows tomorrow's session).
 */
export function defaultRef(
	plan: Plan,
	date: IsoDate,
	entries: readonly LogEntry[],
	skip: Iterable<string> = []
): string | null {
	const logged = entries.find((e) => e.date === date);
	if (logged) return refOf(logged);
	const week = planWeek(plan, { skip });
	const today = weekday(date);
	for (let i = 0; i < 7; i++) {
		const first = week.days[(today + i) % 7]?.[0];
		if (first) return first.ref;
	}
	return plan.sessions[0]?.id ?? plan.activities[0]?.id ?? null;
}

/** What is logged on each day of the week that starts on this Monday. */
export function loggedPerDay(entries: readonly LogEntry[], monday: IsoDate): LogEntry[][] {
	const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
	return days.map((day) => entries.filter((e) => e.date === day));
}

// ---------- the form ----------

function exercisesById(plan: Plan): Map<string, Exercise> {
	return new Map(plan.exercises.map((e) => [e.id, e]));
}

function hasSets(entry: LogEntry, exerciseId: string): boolean {
	return entry.type === 'strength' && entry.exercises.some((e) => e.id === exerciseId);
}

/**
 * Pull-up or lat pulldown? Whichever you did that day, otherwise whichever you
 * did last, so a switch sticks until you switch back.
 */
function variantFor(
	exercise: Exercise,
	date: IsoDate,
	saved: StrengthEntry | undefined,
	history: readonly LogEntry[]
): string {
	const other = exercise.swap;
	if (!other) return exercise.id;
	if (saved && hasSets(saved, other)) return other;
	if (saved && hasSets(saved, exercise.id)) return exercise.id;
	for (let i = history.length - 1; i >= 0; i--) {
		const entry = history[i];
		if (!entry || entry.date > date || entry.id === saved?.id) continue;
		if (hasSets(entry, other)) return other;
		if (hasSets(entry, exercise.id)) return exercise.id;
	}
	return exercise.id;
}

function exerciseForm(
	plan: Plan,
	exercise: Exercise,
	date: IsoDate,
	history: readonly LogEntry[],
	saved: StrengthEntry | undefined
): ExerciseForm {
	const tip = advice(plan, exercise, date, history);
	const savedSets = saved?.exercises.find((e) => e.id === exercise.id)?.sets ?? [];
	const count = Math.max(tip.target.sets, savedSets.length);
	const rows = Array.from({ length: count }, (_, i): SetInput => {
		const set = savedSets[i];
		if (exercise.load === 'reps') return { kg: '', reps: set ? String(set.reps) : '' };
		if (set) return { kg: formatKg(set.kg ?? 0), reps: String(set.reps) };
		const kg = tip.kg ?? savedSets[0]?.kg ?? null;
		return { kg: kg === null ? '' : formatKg(kg), reps: '' };
	});
	return { exercise, advice: tip, rows };
}

/** The form for one training on one day, filled with what you logged or what the advice says. */
export function buildForm(
	plan: Plan,
	date: IsoDate,
	ref: string,
	history: readonly LogEntry[]
): Form | null {
	const id = entryId(date, ref);
	const saved = history.find((e) => e.id === id);

	const session = plan.sessions.find((s) => s.id === ref);
	if (session) {
		const logged = saved?.type === 'strength' ? saved : undefined;
		const byId = exercisesById(plan);
		const ids = session.exercises.map((x) => {
			const exercise = byId.get(x);
			return exercise ? variantFor(exercise, date, logged, history) : x;
		});
		// Something logged that day but not in the session (any more) stays visible.
		for (const done of logged?.exercises ?? [])
			if (!ids.includes(done.id) && byId.has(done.id)) ids.push(done.id);
		const exercises = ids.flatMap((x) => {
			const exercise = byId.get(x);
			return exercise ? [exerciseForm(plan, exercise, date, history, logged)] : [];
		});
		return { kind: 'strength', id, date, ref, exercises, note: logged?.note ?? '' };
	}

	if (plan.activities.some((a) => a.id === ref)) {
		const logged = saved?.type === 'activity' ? saved : undefined;
		const minutes = logged && logged.minutes > 0 ? String(logged.minutes) : '';
		return { kind: 'activity', id, date, ref, minutes, note: logged?.note ?? '' };
	}
	return null;
}

/** Typing a weight in set 1 also fills the next sets you haven't done yet. */
export function setKg(rows: readonly SetInput[], index: number, kg: string): SetInput[] {
	const before = rows[index]?.kg;
	return rows.map((row, i) =>
		i === index || (index === 0 && row.reps === '' && row.kg === before) ? { ...row, kg } : row
	);
}

/** Switch an exercise for its alternative, with fresh advice and empty sets. */
export function swapExercise(
	plan: Plan,
	form: StrengthForm,
	exerciseId: string,
	history: readonly LogEntry[]
): StrengthForm {
	const byId = exercisesById(plan);
	const other = byId.get(byId.get(exerciseId)?.swap ?? '');
	if (!other) return form;
	return {
		...form,
		exercises: form.exercises.map((x) =>
			x.exercise.id === exerciseId ? exerciseForm(plan, other, form.date, history, undefined) : x
		)
	};
}

/**
 * The log entry a form becomes, or null when nothing is filled in (then the
 * day's entry is removed). Sets without reps don't count.
 */
export function toEntry(plan: Plan, form: Form, now: Date = new Date()): LogEntry | null {
	const phase = phaseOf(plan, form.date);
	const note = form.note.trim().slice(0, 2000);
	const common = {
		id: form.id,
		date: form.date,
		week: phase.week,
		block: phase.blockIndex,
		light: phase.light,
		note,
		updated: now.toISOString()
	};

	if (form.kind === 'activity') {
		const activity = plan.activities.find((a) => a.id === form.ref);
		const minutes = parseMinutes(form.minutes);
		if (!activity || (!minutes && !note)) return null;
		return LogEntry.parse({
			...common,
			type: 'activity',
			activity: activity.id,
			name: activity.name,
			minutes
		});
	}

	const exercises = form.exercises.flatMap(({ exercise, rows }) => {
		const sets = rows.flatMap((row) => {
			const reps = parseReps(row.reps);
			if (!reps) return [];
			const typed = exercise.load === 'reps' ? null : parseKg(row.kg);
			const kg = typed ?? (exercise.load === 'bodyweight' ? 0 : null);
			return [{ kg, reps }];
		});
		return sets.length ? [{ id: exercise.id, name: exercise.name, load: exercise.load, sets }] : [];
	});
	if (!exercises.length && !note) return null;
	return LogEntry.parse({ ...common, type: 'strength', session: form.ref, exercises });
}
