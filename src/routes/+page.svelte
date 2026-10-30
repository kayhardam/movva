<!--
  Temporary screen: shows that the plan, the phase and the planner work in the
  browser. The real logbook and setup screens come in the next modules.
-->
<script lang="ts">
	import { today, type Weekday } from '#lib/dates.ts';
	import { phaseOf } from '#lib/phase.ts';
	import { planWeek } from '#lib/planner.ts';
	import { defaultPlan as plan } from '#lib/plan/default-plan.ts';

	const DAYS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
	const names = new Map([...plan.sessions, ...plan.activities].map((x) => [x.id, x.name]));
	const choices = plan.week.filter((s) => s.optional).flatMap((s) => s.refs.slice(0, 1));

	let skip = $state<string[]>([]);
	const phase = $derived(phaseOf(plan, today()));
	const week = $derived(planWeek(plan, { skip }));

	function toggle(ref: string, on: boolean) {
		skip = on ? skip.filter((x) => x !== ref) : [...skip, ref];
	}
</script>

<svelte:head>
	<title>Movva</title>
</svelte:head>

<main>
	<h1>Movva</h1>
	<p>Week {phase.week} · {phase.block.name}{phase.light ? ' · lichte week' : ''}</p>

	<fieldset>
		<legend>Deze week</legend>
		{#each choices as ref (ref)}
			<label>
				<input
					type="checkbox"
					checked={!skip.includes(ref)}
					onchange={(e) => toggle(ref, e.currentTarget.checked)}
				/>
				{names.get(ref)}
			</label>
		{/each}
	</fieldset>

	<ol>
		{#each week.days as items, i (i)}
			<li>
				<b>{DAYS[i]}</b>
				{#if plan.restDays.includes(i as Weekday)}
					Rustdag
				{:else if items.length === 0}
					–
				{:else}
					{items
						.map((p) => [p.ref, ...p.alternatives].map((r) => names.get(r)).join(' of '))
						.join(', ')}
				{/if}
			</li>
		{/each}
	</ol>
</main>

<style>
	main {
		max-width: 30rem;
		margin: 2rem auto;
		padding: 0 1rem;
		font-family: system-ui, sans-serif;
		line-height: 1.5;
	}
	ol {
		list-style: none;
		padding: 0;
	}
	b {
		display: inline-block;
		width: 2.5rem;
	}
</style>
