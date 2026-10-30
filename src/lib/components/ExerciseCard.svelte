<script lang="ts">
	import type { Movva } from '#lib/app.svelte.ts';
	import { nl } from '#lib/i18n/nl.ts';
	import { loadBar } from '#lib/plates.ts';
	import { formatKg, parseKg, parseReps, setKg, type ExerciseForm } from '#lib/session.ts';

	let { app, item, index }: { app: Movva; item: ExerciseForm; index: number } = $props();

	const ex = $derived(item.exercise);
	const tip = $derived(item.advice);
	const swapName = $derived(app.plan.exercises.find((e) => e.id === ex.swap)?.name ?? '');
	const side = $derived(ex.side ? nl.training.perSide[ex.side] : '');
	const unit = $derived(nl.training.unit[ex.load]);

	const bar = $derived(app.plan.equipment.bar);
	const total = $derived(ex.load === 'barbell' ? parseKg(item.rows[0]?.kg ?? '') : null);
	const loading = $derived(total === null ? null : loadBar(total, bar, app.plan.equipment.plates));

	/** Standard plates get their competition colour; anything else a neutral chip. */
	const PLATE_CLASS: Record<string, string> = {
		'25': 'p25',
		'20': 'p20',
		'15': 'p15',
		'10': 'p10',
		'5': 'p5',
		'2.5': 'p2',
		'1.25': 'p1'
	};

	function onkg(i: number, value: string) {
		item.rows = setKg(item.rows, i, value);
		app.changed();
	}

	function onreps(i: number, value: string) {
		const row = item.rows[i];
		if (row) row.reps = value;
		app.changed();
	}
</script>

<li class="card">
	<div class="head">
		<span class="no">{index + 1}</span>
		<h3 class="name">{ex.name}</h3>
		<span class={['tag', ex.role]}>
			{ex.role === 'main' ? nl.training.main : nl.training.accessory}
		</span>
	</div>

	<div class="meta">
		<p class="target">
			{nl.training.sets(
				tip.target.sets,
				ex.load === 'reps' ? nl.training.max : nl.range(tip.target.reps),
				side
			)} · {nl.training.over(tip.target.light ? null : tip.target.rir)}
		</p>
		{#if tip.last}
			<p class="last">
				{nl.training.last}: {nl.shortDate(tip.last.date)} ·
				<b>{nl.setsText(ex.load, tip.last.sets)}</b>
			</p>
		{/if}
		<p class={['advice', tip.kind]}>
			{#if tip.kind === 'up'}<span class="arrow" aria-hidden="true">▲</span>{/if}{nl.advice(
				tip,
				ex,
				swapName
			)}
			{#if tip.kind === 'up' && tip.kg !== null}
				→ <b>{nl.kgLabel(ex.load, tip.kg)}</b>{/if}
		</p>
		{#if ex.swap && swapName}
			<button type="button" class="swap" onclick={() => app.swap(ex.id)}>
				{nl.training.swapTo(swapName)}
			</button>
		{/if}
	</div>

	<div class={['sets', ex.load === 'reps' && 'reps-only']} role="group" aria-label={ex.name}>
		<span class="h">{nl.training.set}</span>
		{#if ex.load !== 'reps'}<span class="h">{unit}</span>{/if}
		<span class="h">{nl.training.reps}{side}</span>
		{#each item.rows as row, i (i)}
			<span class={['setno', parseReps(row.reps) > 0 && 'done']}>{i + 1}</span>
			{#if ex.load !== 'reps'}
				<input
					class="num"
					inputmode="decimal"
					autocomplete="off"
					aria-label={`${ex.name}, set ${i + 1}, ${unit}`}
					value={row.kg}
					oninput={(e) => onkg(i, e.currentTarget.value)}
				/>
			{/if}
			<input
				class="num"
				inputmode="numeric"
				pattern="[0-9]*"
				autocomplete="off"
				aria-label={`${ex.name}, set ${i + 1}, ${nl.training.reps}`}
				placeholder={tip.last?.sets[i] ? String(tip.last.sets[i].reps) : ''}
				value={row.reps}
				oninput={(e) => onreps(i, e.currentTarget.value)}
			/>
		{/each}
	</div>

	{#if loading && total !== null}
		<p class="plates">
			{#if loading.perSide.length === 0 && loading.missing === 0}
				<span>{nl.training.barOnly}</span>
			{:else}
				<span>{nl.training.plates}</span>
				{#each loading.perSide as plate, i (i)}
					<span class={['plate', PLATE_CLASS[String(plate)]]}>{formatKg(plate)}</span>
				{/each}
				{#if loading.missing > 0}<span>{nl.training.missing(loading.missing)}</span>{/if}
			{/if}
			<span class="bar">{nl.training.bar(bar)}</span>
		</p>
	{/if}

	{#if ex.tip}<p class="tip">{ex.tip}</p>{/if}
</li>

<style>
	.card {
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: var(--r);
		padding: 14px;
		display: grid;
		gap: 10px;
		min-width: 0;
	}
	.head {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		gap: 10px;
		align-items: baseline;
	}
	.no {
		font: 800 22px/1 var(--f-display);
		color: var(--muted);
	}
	.name {
		font: 700 23px/1.05 var(--f-display);
		text-transform: uppercase;
		letter-spacing: 0.01em;
		text-wrap: balance;
	}
	.tag {
		font: 700 12px/1 var(--f-display);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		padding: 4px 7px;
		border-radius: 4px;
	}
	.tag.main {
		background: var(--accent);
		color: var(--accent-ink);
	}
	.tag.accessory {
		border: 1px solid var(--line);
		color: var(--muted);
	}
	.meta {
		display: grid;
		gap: 5px;
	}
	.target {
		font-weight: 600;
		font-size: 15px;
		font-variant-numeric: tabular-nums;
	}
	.last {
		font-size: 14px;
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}
	.last b {
		font-weight: 600;
		color: var(--ink);
	}
	.advice {
		justify-self: start;
		font-weight: 600;
		font-size: 14px;
		padding: 5px 10px;
		border-radius: 6px;
		line-height: 1.3;
	}
	.arrow {
		margin-right: 0.3em;
	}
	.advice.up {
		background: var(--go-soft);
		color: var(--go);
	}
	.advice.hold {
		background: var(--sunk);
		color: var(--muted);
	}
	.advice.light {
		background: var(--light-soft);
		color: var(--light);
	}
	.advice.start,
	.advice.swap {
		background: var(--accent-soft);
		color: var(--accent);
	}
	.swap {
		justify-self: start;
		background: none;
		border: 0;
		padding: 2px 0;
		color: var(--accent);
		text-decoration: underline;
		cursor: pointer;
		font-size: 14px;
	}
	.sets {
		display: grid;
		grid-template-columns: 2.4rem minmax(0, 1fr) minmax(0, 1fr);
		gap: 6px 8px;
		align-items: center;
	}
	.sets.reps-only {
		grid-template-columns: 2.4rem minmax(0, 1fr);
	}
	.h {
		font: 600 12px/1.2 var(--f-display);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--muted);
	}
	.setno {
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 50%;
		display: grid;
		place-items: center;
		font: 700 17px/1 var(--f-display);
		border: 1.5px solid var(--line);
		color: var(--muted);
	}
	.setno.done {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--accent-ink);
	}
	.plates {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		align-items: center;
		font-size: 13px;
		color: var(--muted);
	}
	.plates > span:first-child {
		margin-right: 4px;
	}
	.plate {
		min-width: 30px;
		height: 22px;
		padding: 0 6px;
		border-radius: 4px;
		display: inline-grid;
		place-items: center;
		font: 700 13px/1 var(--f-display);
		background: var(--sunk);
		color: var(--ink);
		box-shadow: inset 0 0 0 1px var(--line);
	}
	.p25 {
		background: var(--p25);
		color: #fff;
		box-shadow: none;
	}
	.p20 {
		background: var(--p20);
		color: #fff;
		box-shadow: none;
	}
	.p15 {
		background: var(--p15);
		color: #1a1a1a;
		box-shadow: none;
	}
	.p10 {
		background: var(--p10);
		color: #fff;
		box-shadow: none;
	}
	.p5 {
		background: var(--p5);
		color: #1a1a1a;
		box-shadow: inset 0 0 0 1px #b7bcc2;
	}
	.p2 {
		background: var(--p2);
		color: #fff;
		box-shadow: inset 0 0 0 1px #555;
	}
	.p1 {
		background: var(--p1);
		color: #111;
		box-shadow: none;
	}
	.bar {
		margin-left: auto;
		font-size: 12px;
	}
	.tip {
		font-size: 14px;
		color: var(--muted);
		border-top: 1px dashed var(--line);
		padding-top: 8px;
	}
</style>
