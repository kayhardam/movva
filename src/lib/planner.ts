/**
 * The week layout: which session or activity lands on which day this week.
 *
 * In the old logbook these rules were sentences in the screen code ("did you
 * play handball on Friday? Then strength D today, unless you play on Sunday").
 * Here they are data in the plan, and this function applies them:
 *
 * 1. Sport and matches go first: they decide which days are taken.
 * 2. Then everything with one fixed day.
 * 3. Then everything with several allowed days, on the first one that is free
 *    and, if asked, not the day before a match.
 *
 * Whatever doesn't fit is reported with the reason, so the screen can explain
 * "D drops this week: Friday is handball, Saturday is the day before the match".
 */
import type { Weekday } from './dates.ts';
import type { Plan } from './plan/schema.ts';

export interface Placed {
	/** The session or activity id. */
	ref: string;
	/** What you may do instead, such as running instead of intervals. */
	alternatives: string[];
	/** Index of the line in plan.week this came from. */
	slot: number;
}

export type DayBlock = 'busy' | 'before-match';

export interface Dropped {
	ref: string;
	slot: number;
	/** skipped: switched off this week · sport-this-week: only for weeks without sport · no-free-day: nowhere to go */
	why: 'skipped' | 'sport-this-week' | 'no-free-day';
	/** With 'no-free-day': each allowed day and why it didn't work. */
	tried: { day: Weekday; why: DayBlock }[];
}

export interface WeekPlan {
	/** Index 0 is Monday. */
	days: Placed[][];
	dropped: Dropped[];
	/** At least one sport session or match takes place this week. */
	sport: boolean;
}

export interface WeekChoices {
	/** Optional sessions or activities you leave out this week, such as the match. */
	skip?: Iterable<string>;
}

export function planWeek(plan: Plan, choices: WeekChoices = {}): WeekPlan {
	const kind = new Map(plan.activities.map((a) => [a.id, a.kind]));
	const isSport = (ref: string) => kind.get(ref) === 'sport' || kind.get(ref) === 'match';
	const isMatch = (ref: string) => kind.get(ref) === 'match';
	const skip = new Set(choices.skip);

	const days: Placed[][] = [[], [], [], [], [], [], []];
	const dropped: Dropped[] = [];
	const hasSport = () => days.some((day) => day.some((p) => isSport(p.ref)));

	const pass = (slot: Plan['week'][number]) =>
		slot.refs.some(isSport) ? 0 : slot.days.length === 1 ? 1 : 2;
	const order = plan.week
		.map((slot, index) => ({ slot, index }))
		.sort((a, b) => pass(a.slot) - pass(b.slot) || a.index - b.index);

	for (const { slot, index } of order) {
		const [ref, ...alternatives] = slot.refs;
		if (ref === undefined) continue;
		if (slot.optional && skip.has(ref)) {
			dropped.push({ ref, slot: index, why: 'skipped', tried: [] });
			continue;
		}
		if (slot.onlyWithoutSport && hasSport()) {
			dropped.push({ ref, slot: index, why: 'sport-this-week', tried: [] });
			continue;
		}

		// A fixed day is the user's own choice; only a movable slot looks for a free day.
		const movable = slot.days.length > 1;
		const tried: Dropped['tried'] = [];
		const day = slot.days.find((d) => {
			// Sunday looks at Monday: the template repeats, so next week starts the same way.
			const why: DayBlock | null =
				movable && days[d]!.length > 0
					? 'busy'
					: slot.notBeforeMatch && days[(d + 1) % 7]!.some((p) => isMatch(p.ref))
						? 'before-match'
						: null;
			if (why) tried.push({ day: d, why });
			return why === null;
		});

		if (day === undefined) dropped.push({ ref, slot: index, why: 'no-free-day', tried });
		else days[day]!.push({ ref, alternatives, slot: index });
	}

	return { days, dropped, sport: hasSport() };
}
