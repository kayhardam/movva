<script lang="ts">
	import type { Movva } from '#lib/app.svelte.ts';
	import { addDays, today, type Weekday } from '#lib/dates.ts';
	import { nl } from '#lib/i18n/nl.ts';
	import type { LogEntry } from '#lib/log/schema.ts';
	import { loggedPerDay } from '#lib/session.ts';

	let { app }: { app: Movva } = $props();

	const plan = $derived(app.plan);
	const phase = $derived(app.phase);
	const now = today();

	const labels = $derived(
		new Map([...plan.sessions, ...plan.activities].map((x) => [x.id, x.label]))
	);
	const names = $derived(
		new Map([
			...plan.sessions.map((s) => [s.id, nl.strength(s.label)] as const),
			...plan.activities.map((a) => [a.id, a.name] as const)
		])
	);
	const logged = $derived(loggedPerDay(app.entries, phase.monday));
	const choices = $derived(
		plan.week.flatMap((slot) => (slot.optional && slot.refs[0] ? [slot.refs[0]] : []))
	);
	const reasons = $derived(
		app.week.dropped
			// Skipped is your own choice, and a stand-in that isn't needed needs no word either.
			.filter((d) => d.why === 'no-free-day')
			.map((d) => nl.week.dropped(d, names.get(d.ref) ?? d.ref))
	);

	const refOf = (e: LogEntry) => (e.type === 'strength' ? e.session : e.activity);

	function dayText(i: number, planned: { ref: string }[]): string {
		const done = logged[i] ?? [];
		if (done.length) return done.map((e) => labels.get(refOf(e)) ?? '?').join(' ');
		if (plan.restDays.includes(i as Weekday)) return '–';
		return planned.map((p) => labels.get(p.ref) ?? '?').join(' ') || '–';
	}

	function dayLabel(i: number, date: string, planned: { ref: string }[]): string {
		const done = logged[i] ?? [];
		const what = done.length
			? done.map((e) => names.get(refOf(e)) ?? e.id).join(', ')
			: planned.length
				? `${nl.week.planned}: ${planned.map((p) => names.get(p.ref)).join(', ')}`
				: nl.week.rest;
		return `${nl.shortDate(date)}: ${what}`;
	}
</script>

<section class={['phase', phase.light && 'light']} aria-label={nl.phase.week}>
	<div class="top">
		<div class="wk">
			<span class="wk-l">{nl.phase.week}</span>
			<span class="wk-n">{phase.week}</span>
		</div>
		<div>
			<p class="name">
				{phase.light ? nl.phase.light : nl.phase.block(phase.blockIndex + 1, phase.block.name)}
			</p>
			<p class="dates">
				{nl.dayMonth(phase.monday)} – {nl.dayMonth(phase.sunday)}{phase.light
					? ` · ${nl.phase.sameWeight}`
					: ''}
			</p>
		</div>
	</div>

	<dl class="targets">
		<div>
			<dt>{nl.phase.main}</dt>
			<dd>{phase.sets} × {nl.range(phase.main)}</dd>
		</div>
		<div>
			<dt>{nl.phase.accessory}</dt>
			<dd>{phase.sets} × {nl.range(phase.accessory)}</dd>
		</div>
		<div>
			<dt>{nl.phase.rir}</dt>
			<dd>{phase.light ? nl.phase.plenty : nl.range(phase.rir)}</dd>
		</div>
	</dl>

	<div class="strip" role="group" aria-label={nl.week.label}>
		{#each app.week.days as planned, i (i)}
			{@const date = addDays(phase.monday, i)}
			<button
				type="button"
				class={[
					'day',
					(logged[i] ?? []).length > 0 && 'done',
					date === app.date && 'sel',
					date === now && 'now'
				]}
				aria-label={dayLabel(i, date, planned)}
				aria-current={date === app.date ? 'date' : undefined}
				onclick={() => app.open(date)}
			>
				<span class="dn">{nl.days[i]}</span>
				<span class="ab">{dayText(i, planned)}</span>
			</button>
		{/each}
	</div>

	{#if choices.length}
		<fieldset class="choices">
			<legend class="label">{nl.week.choices}</legend>
			{#each choices as ref (ref)}
				<label class="choice">
					<input
						type="checkbox"
						checked={!app.skip.includes(ref)}
						onchange={(e) => app.choose(ref, e.currentTarget.checked)}
					/>
					{names.get(ref)}
				</label>
			{/each}
		</fieldset>
	{/if}

	{#each reasons as reason (reason)}
		<p class="reason">{reason}</p>
	{/each}
	{#if phase.outside === 'before'}
		<p class="reason">{nl.phase.before(plan.start)}</p>
	{:else if phase.outside === 'after'}
		<p class="reason">{nl.phase.after}</p>
	{/if}
</section>

<style>
	.phase {
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: var(--r);
		padding: 14px 16px;
		display: grid;
		gap: 12px;
	}
	.phase.light {
		border-color: var(--light);
		background: var(--light-soft);
	}
	.top {
		display: flex;
		align-items: center;
		gap: 14px;
	}
	.wk {
		display: grid;
		justify-items: center;
		min-width: 56px;
		padding: 4px 8px;
		border: 2px solid var(--ink);
		border-radius: 6px;
	}
	.wk-l {
		font: 700 12px/1 var(--f-display);
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}
	.wk-n {
		font: 800 36px/1 var(--f-display);
		font-variant-numeric: tabular-nums;
	}
	.name {
		font: 700 22px/1.1 var(--f-display);
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}
	.dates {
		font-size: 14px;
		color: var(--muted);
	}
	.targets {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 8px;
		margin: 0;
	}
	.targets div {
		display: grid;
		gap: 2px;
	}
	dt {
		font: 600 12px/1.2 var(--f-display);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--muted);
	}
	dd {
		margin: 0;
		font-weight: 700;
		font-size: 17px;
		font-variant-numeric: tabular-nums;
	}
	.strip {
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		gap: 4px;
	}
	.day {
		display: grid;
		gap: 3px;
		justify-items: center;
		align-content: start;
		padding: 6px 2px;
		border: 1px solid var(--line);
		border-radius: 6px;
		background: var(--surface);
		cursor: pointer;
		min-height: 52px;
		min-width: 0;
	}
	.dn {
		font: 600 12px/1 var(--f-display);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--muted);
	}
	.ab {
		font: 800 16px/1.05 var(--f-display);
		text-align: center;
		overflow-wrap: anywhere;
		color: var(--muted);
	}
	.day.done {
		background: var(--accent-soft);
		border-color: var(--accent-soft);
	}
	.day.done .ab {
		color: var(--accent);
	}
	.day.now .dn {
		color: var(--ink);
		font-weight: 700;
	}
	.day.sel {
		box-shadow: inset 0 0 0 2px var(--ink);
	}
	.choices {
		border: 0;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px 14px;
	}
	.choices legend {
		width: 100%;
		padding: 0;
		margin-bottom: 2px;
	}
	.choice {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-weight: 600;
		min-height: 32px;
		cursor: pointer;
	}
	.choice input {
		width: 20px;
		height: 20px;
		accent-color: var(--accent);
	}
	.reason {
		font-size: 14px;
		color: var(--muted);
	}
</style>
