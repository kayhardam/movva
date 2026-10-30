/**
 * A training plan as data.
 *
 * Plans arrive from links and imported files, so everything is checked on the
 * way in. One Zod definition gives both the TypeScript types and that check,
 * so the two can never drift apart.
 */
import { z } from 'zod';
import { isIsoDate } from '../dates.ts';

export const PLAN_VERSION = 1;

/** Ids end up in links, storage keys and HTML attributes, so they stay plain. */
export const Id = z
	.string()
	.max(32)
	.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, digits and dashes');

export const IsoDateSchema = z.string().refine(isIsoDate, 'Not a valid date (YYYY-MM-DD)');

/** 0 = Monday … 6 = Sunday. */
export const WeekdaySchema = z.literal([0, 1, 2, 3, 4, 5, 6]);

const text = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) => z.string().trim().max(max).optional();

/** An inclusive range such as 10–12 reps. */
export const Range = z
	.tuple([z.int().min(0).max(50), z.int().min(0).max(50)])
	.refine(([lo, hi]) => lo <= hi, 'The first number may not be higher than the second');
export type Range = z.infer<typeof Range>;

/**
 * How an exercise is loaded, which decides what you fill in:
 * - barbell: total weight including the bar (gets the plate calculator)
 * - dumbbell: weight per dumbbell
 * - weight: total weight on a machine, cable or fixed bar
 * - bodyweight: extra weight, 0 means bodyweight only
 * - reps: no weight, only repetitions (roll-outs)
 */
export const Load = z.enum(['barbell', 'dumbbell', 'weight', 'bodyweight', 'reps']);
export type Load = z.infer<typeof Load>;

export const Exercise = z.object({
	id: Id,
	name: text(60),
	/** Main lifts follow the main rep range, accessories the accessory range. */
	role: z.enum(['main', 'accessory']),
	load: Load,
	/** The smallest jump in kg you can really make on this exercise. */
	step: z.number().positive().max(20).default(2.5),
	/** One side at a time: reps count per arm or per leg. */
	side: z.enum(['arm', 'leg']).optional(),
	tip: optionalText(200),
	/** An alternative to switch to, such as pull-up ↔ lat pulldown. */
	swap: Id.optional()
});
export type Exercise = z.infer<typeof Exercise>;

/** A strength session such as "A: squat day". */
export const Session = z.object({
	id: Id,
	/** One to three characters for the week strip: A, B, C, D. */
	label: text(3),
	name: text(40),
	exercises: z.array(Id).min(1).max(12),
	note: optionalText(200)
});
export type Session = z.infer<typeof Session>;

/** Anything that isn't lifting: team training, a match, conditioning. */
export const Activity = z.object({
	id: Id,
	label: text(3),
	name: text(40),
	/** A match matters to the planner: nothing heavy the day before. */
	kind: z.enum(['sport', 'match', 'cardio']),
	/** A short line under the name: '18:30–20:00', '2 × 20 min'. */
	detail: optionalText(60),
	minutes: z.int().min(1).max(600).optional(),
	tips: z.array(text(200)).max(8).default([])
});
export type Activity = z.infer<typeof Activity>;

/**
 * One line of the week template.
 *
 * One allowed day means a fixed day. Several days means "the first of these
 * that is free"; that is how strength session D moves between Friday and
 * Saturday depending on handball.
 */
export const Slot = z.object({
	/** A session or activity id. Extra ids are alternatives, such as running instead of intervals. */
	refs: z.array(Id).min(1).max(4),
	/** Allowed days in order of preference. */
	days: z.array(WeekdaySchema).min(1).max(7),
	/** A choice per week, like handball: on, unless switched off for that week. */
	optional: z.boolean().default(false),
	/** Never on the day before a match. */
	notBeforeMatch: z.boolean().default(false),
	/** Only in weeks without sport or a match, as a stand-in. */
	onlyWithoutSport: z.boolean().default(false)
});
export type Slot = z.infer<typeof Slot>;

/** A block of weeks with the same rep ranges. */
export const Block = z.object({
	name: text(30),
	weeks: z.int().min(1).max(26),
	main: Range,
	accessory: Range,
	/** Reps in reserve: how many more you could have done. */
	rir: Range,
	/** Follow the block with a light week: fewer sets, same weight. */
	deload: z.boolean().default(true)
});
export type Block = z.infer<typeof Block>;

const PlanShape = z.object({
	v: z.literal(PLAN_VERSION),
	name: text(60),
	/** Week 1 is the Monday-to-Sunday week this date falls in. */
	start: IsoDateSchema,
	restDays: z.array(WeekdaySchema).max(6).default([]),
	week: z.array(Slot).max(14),
	sessions: z.array(Session).max(7),
	activities: z.array(Activity).max(8),
	exercises: z.array(Exercise).min(1).max(80),
	blocks: z.array(Block).min(1).max(8),
	sets: z
		.object({ normal: z.int().min(1).max(10), light: z.int().min(1).max(10) })
		.default({ normal: 3, light: 2 }),
	equipment: z
		.object({
			bar: z.number().min(0).max(30),
			plates: z.array(z.number().positive().max(50)).min(1).max(12)
		})
		.default({ bar: 20, plates: [25, 20, 15, 10, 5, 2.5, 1.25] })
});

/** The shape checks above can't see whether ids point at something that exists; this can. */
export const Plan = PlanShape.superRefine((plan, ctx) => {
	const issue = (message: string, path: (string | number)[]) =>
		ctx.addIssue({ code: 'custom', message, path });

	const exercises = new Set<string>();
	plan.exercises.forEach((ex, i) => {
		if (exercises.has(ex.id)) issue(`Exercise "${ex.id}" appears twice`, ['exercises', i, 'id']);
		exercises.add(ex.id);
	});
	plan.exercises.forEach((ex, i) => {
		if (ex.swap !== undefined && (ex.swap === ex.id || !exercises.has(ex.swap)))
			issue(`Unknown exercise to swap to: "${ex.swap}"`, ['exercises', i, 'swap']);
	});

	// Sessions and activities share one set of ids, because the week refers to both.
	const refs = new Set<string>();
	plan.sessions.forEach((session, i) => {
		if (refs.has(session.id)) issue(`Id "${session.id}" appears twice`, ['sessions', i, 'id']);
		refs.add(session.id);
		session.exercises.forEach((id, j) => {
			if (!exercises.has(id)) issue(`Unknown exercise "${id}"`, ['sessions', i, 'exercises', j]);
		});
	});
	plan.activities.forEach((activity, i) => {
		if (refs.has(activity.id)) issue(`Id "${activity.id}" appears twice`, ['activities', i, 'id']);
		refs.add(activity.id);
	});

	plan.week.forEach((slot, i) => {
		slot.refs.forEach((id, j) => {
			if (!refs.has(id)) issue(`Unknown session or activity "${id}"`, ['week', i, 'refs', j]);
		});
		slot.days.forEach((day, j) => {
			if (plan.restDays.includes(day)) issue('This day is a rest day', ['week', i, 'days', j]);
		});
		if (new Set(slot.days).size !== slot.days.length)
			issue('A day appears twice', ['week', i, 'days']);
		if (slot.optional && slot.refs.length > 1)
			issue('A weekly choice holds one session or activity', ['week', i, 'refs']);
	});
});
export type Plan = z.infer<typeof Plan>;
export type PlanInput = z.input<typeof Plan>;

export type ParseResult<T> = { ok: true; value: T } | { ok: false; errors: string[] };

/** Check anything that claims to be a plan: a shared link, an imported file, old storage. */
export function parsePlan(input: unknown): ParseResult<Plan> {
	const result = Plan.safeParse(input);
	if (result.success) return { ok: true, value: result.data };
	return {
		ok: false,
		errors: result.error.issues.map((i) => `${i.path.join('.') || 'plan'}: ${i.message}`)
	};
}
