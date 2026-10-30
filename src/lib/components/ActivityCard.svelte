<script lang="ts">
	import type { Movva } from '#lib/app.svelte.ts';
	import { nl } from '#lib/i18n/nl.ts';
	import type { ActivityForm } from '#lib/session.ts';

	let { app, form }: { app: Movva; form: ActivityForm } = $props();

	const activity = $derived(app.plan.activities.find((a) => a.id === form.ref));
	const previous = $derived(
		app.entries.findLast(
			(e) => e.type === 'activity' && e.activity === form.ref && e.date < form.date
		)
	);
</script>

{#if activity}
	<li class="card">
		<div class="head">
			<h3 class="name">{activity.name}</h3>
			<span class="tag">{nl.kind[activity.kind]}</span>
		</div>
		<div class="meta">
			{#if activity.detail}<p class="target">{activity.detail}</p>{/if}
			{#if previous?.type === 'activity'}
				<p class="last">
					{nl.training.last}: {nl.shortDate(previous.date)}{#if previous.minutes}
						· <b>{nl.progress.minutes(previous.minutes)}</b>{/if}
				</p>
			{/if}
		</div>
		{#if activity.tips.length}
			<ul class="tips">
				{#each activity.tips as tip, i (i)}<li>{tip}</li>{/each}
			</ul>
		{/if}
		<div class="minutes">
			<label class="label" for="minutes">{nl.training.minutes}</label>
			<input
				id="minutes"
				class="num"
				inputmode="numeric"
				pattern="[0-9]*"
				autocomplete="off"
				placeholder={activity.minutes ? String(activity.minutes) : ''}
				value={form.minutes}
				oninput={(e) => {
					form.minutes = e.currentTarget.value;
					app.changed();
				}}
			/>
		</div>
	</li>
{/if}

<style>
	.card {
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: var(--r);
		padding: 14px;
		display: grid;
		gap: 10px;
	}
	.head {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 10px;
		align-items: baseline;
	}
	.name {
		font: 700 23px/1.05 var(--f-display);
		text-transform: uppercase;
	}
	.tag {
		font: 700 12px/1 var(--f-display);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		padding: 4px 7px;
		border-radius: 4px;
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
	}
	.last {
		font-size: 14px;
		color: var(--muted);
	}
	.last b {
		font-weight: 600;
		color: var(--ink);
	}
	.tips {
		margin: 0;
		padding-left: 20px;
		display: grid;
		gap: 5px;
		font-size: 15px;
	}
	.minutes {
		display: grid;
		grid-template-columns: auto 7.5rem;
		gap: 12px;
		align-items: center;
		justify-content: start;
		border-top: 1px dashed var(--line);
		padding-top: 10px;
	}
</style>
