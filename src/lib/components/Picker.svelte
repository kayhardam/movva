<script lang="ts">
	import type { Movva } from '#lib/app.svelte.ts';
	import { nl } from '#lib/i18n/nl.ts';

	let { app }: { app: Movva } = $props();

	const plan = $derived(app.plan);
	const doneThisWeek = $derived(
		new Set(
			app.entries
				.filter((e) => e.date >= app.phase.monday && e.date <= app.phase.sunday)
				.map((e) => (e.type === 'strength' ? e.session : e.activity))
		)
	);
</script>

<div class="pick" role="group" aria-label={nl.training.pick}>
	<div class="row">
		{#each plan.sessions as session (session.id)}
			<button
				type="button"
				class="opt"
				aria-pressed={app.ref === session.id}
				onclick={() => app.open(app.date, session.id)}
			>
				<span class="big">
					{session.label}
					{#if doneThisWeek.has(session.id)}
						<span class="chk" title={nl.loggedThisWeek}>✓</span>
					{/if}
				</span>
				<span class="small">{session.name}</span>
			</button>
		{/each}
	</div>
	<div class="row acts">
		{#each plan.activities as activity (activity.id)}
			<button
				type="button"
				class="opt"
				aria-pressed={app.ref === activity.id}
				onclick={() => app.open(app.date, activity.id)}
			>
				<span class="big">
					{activity.name}
					{#if doneThisWeek.has(activity.id)}
						<span class="chk" title={nl.loggedThisWeek}>✓</span>
					{/if}
				</span>
				{#if activity.detail}<span class="small">{activity.detail}</span>{/if}
			</button>
		{/each}
	</div>
</div>

<style>
	.pick {
		display: grid;
		gap: 8px;
	}
	.row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(4.5rem, 1fr));
		gap: 6px;
	}
	.opt {
		display: grid;
		gap: 2px;
		justify-items: center;
		align-content: center;
		padding: 8px 4px;
		border: 1px solid var(--line);
		border-radius: 8px;
		background: var(--surface);
		cursor: pointer;
		min-height: 56px;
		min-width: 0;
	}
	.big {
		font: 800 21px/1 var(--f-display);
	}
	.small {
		font-size: 12px;
		line-height: 1.2;
		color: var(--muted);
		text-align: center;
	}
	.acts .opt {
		min-height: 50px;
		background: var(--sunk);
	}
	.acts .big {
		font-size: 15px;
		font-weight: 700;
		line-height: 1.1;
		text-align: center;
		overflow-wrap: anywhere;
		max-width: 100%;
	}
	.chk {
		color: var(--go);
		font-size: 15px;
	}
	.opt[aria-pressed='true'] {
		background: var(--ink);
		border-color: var(--ink);
		color: var(--bg);
	}
	.opt[aria-pressed='true'] .small,
	.opt[aria-pressed='true'] .chk {
		color: var(--bg);
	}
</style>
