<script lang="ts">
	import type { Movva } from '#lib/app.svelte.ts';
	import { today } from '#lib/dates.ts';
	import { nl } from '#lib/i18n/nl.ts';
	import type { LogEntry } from '#lib/log/schema.ts';
	import { activityTotals, exerciseProgress, type ExerciseProgress } from '#lib/progress.ts';
	import { formatKg } from '#lib/session.ts';
	import Sparkline from './Sparkline.svelte';

	let { app }: { app: Movva } = $props();

	const all = $derived(exerciseProgress(app.plan, app.entries));
	const main = $derived(all.filter((p) => p.role === 'main'));
	const accessory = $derived(all.filter((p) => p.role === 'accessory'));
	const totals = $derived(activityTotals(app.plan, app.entries, today()));
	const history = $derived([...app.entries].reverse());
	const sessions = $derived(new Map(app.plan.sessions.map((s) => [s.id, s])));

	function changeText(p: ExerciseProgress): string {
		const first = p.points[0];
		if (!first) return '';
		if (p.points.length < 2) return nl.progress.first(first.date);
		if (p.change === 0) return nl.progress.same(first.date);
		const amount =
			p.load === 'reps' ? `${Math.abs(p.change)} herh.` : `${formatKg(Math.abs(p.change))} kg`;
		return nl.progress.change(p.change > 0, amount, first.date);
	}

	function title(e: LogEntry): string {
		if (e.type === 'activity') return e.name;
		const session = sessions.get(e.session);
		return session ? `${nl.strength(session.label)} · ${session.name}` : e.session;
	}

	function size(e: LogEntry): string {
		if (e.type === 'activity') return e.minutes ? nl.progress.minutes(e.minutes) : '';
		return nl.progress.sets(e.exercises.reduce((n, x) => n + x.sets.length, 0));
	}

	function reopen(e: LogEntry) {
		app.tab = 'training';
		void app.open(e.date, e.type === 'strength' ? e.session : e.activity);
	}
</script>

{#snippet rows(items: ExerciseProgress[])}
	{#each items as p (p.id)}
		<div class={['row', p.points.length === 0 && 'none']}>
			<span class="name">{p.name}</span>
			<Sparkline values={p.points.map((x) => x.value)} />
			{#if p.last}
				<span class="sets">{nl.setsText(p.load, p.last.sets)}</span>
				<span class={['change', p.change > 0 && 'up']}>
					{changeText(p)} · {nl.progress.times(p.points.length)}
				</span>
			{:else}
				<span class="sets">{nl.progress.notYet}</span>
			{/if}
		</div>
	{/each}
{/snippet}

<section class="view" aria-label={nl.tabs.progress}>
	{#if app.entries.length === 0}
		<div class="empty">
			<p class="empty-t">{nl.progress.emptyTitle}</p>
			<p>{nl.progress.emptyText}</p>
		</div>
	{:else}
		<h2 class="label">{nl.progress.main}</h2>
		<div>{@render rows(main)}</div>

		<h2 class="label">{nl.progress.activities}</h2>
		<div>
			{#each totals as t (t.activity.id)}
				<div class="row short">
					<span class="name">{t.activity.name}</span>
					<span class="count">
						<b>{nl.progress.times(t.count)}</b>{#if t.minutes}
							· {nl.progress.minutes(t.minutes)}{/if}
					</span>
				</div>
			{/each}
		</div>

		<details>
			<summary class="label">{nl.progress.accessory}</summary>
			{@render rows(accessory)}
		</details>

		<h2 class="label">{nl.progress.history}</h2>
		<ul class="history">
			{#each history as e (e.id)}
				<li>
					<button type="button" onclick={() => reopen(e)}>
						<span class="date">{nl.shortDate(e.date)}</span>
						<span class="size">{size(e)}</span>
						<span class="what">{title(e)}{e.light ? ` · ${nl.progress.light}` : ''}</span>
						{#if e.note}<span class="note">{e.note}</span>{/if}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.view {
		display: grid;
		gap: 10px;
		padding-block: 16px 8px;
	}
	h2 {
		margin-top: 8px;
	}
	.row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		column-gap: 12px;
		row-gap: 2px;
		padding: 10px 0;
		border-top: 1px solid var(--line);
		align-items: center;
	}
	.row :global(.spark) {
		grid-column: 2;
		grid-row: 1 / span 3;
	}
	.name {
		font: 700 18px/1.1 var(--f-display);
		text-transform: uppercase;
	}
	.sets {
		font-size: 14px;
		font-variant-numeric: tabular-nums;
		min-width: 0;
	}
	.none .sets {
		color: var(--muted);
	}
	.change {
		font-size: 13px;
		color: var(--muted);
	}
	.change.up {
		color: var(--go);
		font-weight: 600;
	}
	.row.short {
		align-items: baseline;
		padding: 9px 0;
	}
	.count {
		font-size: 14px;
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}
	.count b {
		color: var(--ink);
		font-weight: 600;
	}
	summary {
		cursor: pointer;
		padding: 8px 0;
	}
	.empty {
		background: var(--surface);
		border: 1px dashed var(--line);
		border-radius: var(--r);
		padding: 18px 16px;
		display: grid;
		gap: 6px;
		color: var(--muted);
	}
	.empty-t {
		font: 700 20px/1.1 var(--f-display);
		text-transform: uppercase;
		color: var(--ink);
	}
	.history {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.history button {
		width: 100%;
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 2px 10px;
		text-align: left;
		background: none;
		border: 0;
		border-top: 1px solid var(--line);
		padding: 10px 0;
		cursor: pointer;
	}
	.date {
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
	.size,
	.what,
	.note {
		font-size: 14px;
		color: var(--muted);
	}
	.what,
	.note {
		grid-column: 1 / -1;
	}
	.note {
		font-style: italic;
		overflow-wrap: anywhere;
	}
</style>
