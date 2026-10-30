/**
 * The app's state: today's training, the form you are filling in, and saving
 * without a save button. The rules live in the plain `.ts` files next to this
 * one; this class only connects them to the screen and to storage.
 */
import { defaultPlan } from './plan/default-plan.ts';
import { mondayOf, today, type IsoDate } from './dates.ts';
import type { LogEntry } from './log/schema.ts';
import { phaseOf } from './phase.ts';
import { planWeek } from './planner.ts';
import { buildForm, defaultRef, swapExercise, toEntry, type Form } from './session.ts';
import { openStore, type Store } from './store/store.ts';

export type SaveStatus = 'loading' | 'ready' | 'dirty' | 'saving' | 'saved' | 'error' | 'memory';

/** Wait this long after the last keystroke before saving. */
const QUIET_MS = 600;

export class Movva {
	readonly plan = defaultPlan;

	/** Everything logged, oldest first. Only ever replaced as a whole, so not deeply reactive. */
	entries = $state.raw<LogEntry[]>([]);
	date = $state(today());
	ref = $state<string | null>(null);
	/** The form being filled in. Deeply reactive, so inputs can write into it directly. */
	form = $state<Form | null>(null);
	/** Optional sessions or activities left out in the week of `date`. */
	skip = $state.raw<string[]>([]);
	status = $state<SaveStatus>('loading');
	tab = $state<'training' | 'progress'>('training');

	phase = $derived(phaseOf(this.plan, this.date));
	week = $derived(planWeek(this.plan, { skip: this.skip }));
	/** Whether today's training already has an entry, which can then be removed. */
	saved = $derived(this.entries.some((e) => e.id === this.form?.id));

	#store: Store | null = null;
	#dirty = false;
	#version = 0;
	#timer: ReturnType<typeof setTimeout> | undefined;
	#queue: Promise<void> = Promise.resolve();

	/** Open storage, read the log and show today's training. */
	async start(): Promise<void> {
		const store = await openStore();
		this.#store = store;
		this.entries = await store.entries();
		await this.open(this.date);
		this.status = store.kind === 'memory' ? 'memory' : 'ready';
	}

	get memoryOnly(): boolean {
		return this.#store?.kind === 'memory';
	}

	/** Show a day; without a ref, the training that day calls for. Saves pending changes first. */
	async open(date: IsoDate, ref?: string): Promise<void> {
		await this.flush();
		if (mondayOf(date) !== mondayOf(this.date) || !this.ref) {
			this.skip = (await this.#store?.skipped(mondayOf(date))) ?? [];
		}
		this.date = date;
		this.ref = ref ?? defaultRef(this.plan, date, this.entries, this.skip);
		this.form = this.ref ? buildForm(this.plan, date, this.ref, this.entries) : null;
	}

	/** Leave an optional session or activity in or out this week. */
	async choose(ref: string, on: boolean): Promise<void> {
		this.skip = on ? this.skip.filter((x) => x !== ref) : [...this.skip, ref];
		await this.#store?.setSkipped(mondayOf(this.date), this.skip);
	}

	/** Swap an exercise for its alternative, such as pull-up for lat pulldown. */
	swap(exerciseId: string): void {
		if (this.form?.kind !== 'strength') return;
		this.form = swapExercise(this.plan, $state.snapshot(this.form), exerciseId, this.entries);
		this.changed();
	}

	/** Call after every change to the form: it saves once you stop typing. */
	changed(delay = QUIET_MS): void {
		this.#dirty = true;
		this.#version++;
		if (this.status !== 'memory') this.status = 'dirty';
		clearTimeout(this.#timer);
		this.#timer = setTimeout(() => void this.flush(), delay);
	}

	/** Save now if anything changed. Saves run one after another, never at the same time. */
	flush(): Promise<void> {
		clearTimeout(this.#timer);
		this.#queue = this.#queue.then(
			() => this.#write(),
			() => this.#write()
		);
		return this.#queue;
	}

	async #write(): Promise<void> {
		const store = this.#store;
		if (!this.#dirty || !this.form || !store) return;
		const form = $state.snapshot(this.form);
		const version = this.#version;
		if (store.kind !== 'memory') this.status = 'saving';
		try {
			const entry = toEntry(this.plan, form);
			if (entry) await store.put(entry);
			else await store.remove(form.id);
			this.entries = await store.entries();
			// Typed on while this was saving? Then it isn't finished.
			if (version === this.#version) {
				this.#dirty = false;
				if (store.kind !== 'memory') this.status = 'saved';
			}
		} catch {
			this.status = 'error';
		}
	}

	/** Remove the training shown, after the person confirmed. */
	async remove(): Promise<void> {
		const store = this.#store;
		if (!store || !this.form) return;
		clearTimeout(this.#timer);
		this.#dirty = false;
		this.#version++;
		await this.#queue;
		await store.remove(this.form.id);
		this.entries = await store.entries();
		if (this.ref) this.form = buildForm(this.plan, this.date, this.ref, this.entries);
		if (store.kind !== 'memory') this.status = 'saved';
	}
}
