<script lang="ts">
	import { Movva } from '#lib/app.svelte.ts';
	import ActivityCard from '#lib/components/ActivityCard.svelte';
	import ExerciseCard from '#lib/components/ExerciseCard.svelte';
	import Header from '#lib/components/Header.svelte';
	import PhaseCard from '#lib/components/PhaseCard.svelte';
	import Picker from '#lib/components/Picker.svelte';
	import ProgressView from '#lib/components/ProgressView.svelte';
	import { isIsoDate, weekday } from '#lib/dates.ts';
	import { nl } from '#lib/i18n/nl.ts';

	const app = new Movva();
	void app.start();

	let confirming = $state(false);
	const session = $derived(app.plan.sessions.find((s) => s.id === app.ref));
	const restDay = $derived(app.plan.restDays.includes(weekday(app.date)));

	// Save before the phone locks or the app goes to the background.
	function onvisibilitychange() {
		if (document.visibilityState === 'hidden') void app.flush();
	}

	// Enter jumps to the next number field, so a set takes two taps on the keyboard.
	function onkeydown(e: KeyboardEvent) {
		const field = e.target;
		if (
			e.key !== 'Enter' ||
			!(field instanceof HTMLInputElement) ||
			!field.classList.contains('num')
		)
			return;
		e.preventDefault();
		const fields = [...document.querySelectorAll<HTMLInputElement>('.training input.num')];
		const next = fields[fields.indexOf(field) + 1];
		if (next) next.focus();
		else field.blur();
	}

	function ondatechange(e: Event & { currentTarget: HTMLInputElement }) {
		const value = e.currentTarget.value;
		if (isIsoDate(value)) void app.open(value);
		else e.currentTarget.value = app.date;
	}
</script>

<svelte:head>
	<title>Movva</title>
	<meta
		name="description"
		content="Je weekschema voor wedstrijdsport en krachttraining: plan je kracht rond je sport, log je sets en zie wat je volgende keer tilt."
	/>
</svelte:head>

<svelte:document {onvisibilitychange} {onkeydown} />
<svelte:window onpagehide={() => void app.flush()} />

<div class="wrap">
	<Header {app} />

	{#if app.memoryOnly}
		<p class="notice">{nl.memoryNotice}</p>
	{/if}

	<PhaseCard {app} />

	<div class="tabs" role="tablist" aria-label={nl.tabs.training}>
		<button
			type="button"
			role="tab"
			id="tab-training"
			aria-controls="panel"
			aria-selected={app.tab === 'training'}
			onclick={() => (app.tab = 'training')}>{nl.tabs.training}</button
		>
		<button
			type="button"
			role="tab"
			id="tab-progress"
			aria-controls="panel"
			aria-selected={app.tab === 'progress'}
			onclick={() => (app.tab = 'progress')}>{nl.tabs.progress}</button
		>
	</div>

	<main>
		<div id="panel" role="tabpanel" aria-labelledby={`tab-${app.tab}`}>
			{#if app.tab === 'progress'}
				<ProgressView {app} />
			{:else if app.form}
				<section class="training" aria-label={nl.tabs.training}>
					<div class="date-row">
						<label class="label" for="date">{nl.training.date}</label>
						<input id="date" type="date" value={app.date} onchange={ondatechange} />
					</div>
					<Picker {app} />

					{#if restDay}<p class="hint">{nl.training.restDay}</p>{/if}
					{#if session?.note && app.form.kind === 'strength'}<p class="hint">{session.note}</p>{/if}

					<ol class="list">
						{#if app.form.kind === 'strength'}
							{#each app.form.exercises as item, i (item.exercise.id)}
								<ExerciseCard {app} {item} index={i} />
							{/each}
						{:else}
							<ActivityCard {app} form={app.form} />
						{/if}
					</ol>

					<div class="note">
						<label class="label" for="note">{nl.training.note}</label>
						<textarea
							id="note"
							placeholder={nl.training.notePlaceholder}
							value={app.form.note}
							oninput={(e) => {
								if (app.form) app.form.note = e.currentTarget.value;
								app.changed();
							}}></textarea>
					</div>

					{#if app.saved}
						<div class="remove">
							{#if confirming}
								<span>{nl.training.removeAsk}</span>
								<button
									type="button"
									class="danger"
									onclick={async () => {
										await app.remove();
										confirming = false;
									}}>{nl.training.removeYes}</button
								>
								<button type="button" class="link" onclick={() => (confirming = false)}
									>{nl.training.cancel}</button
								>
							{:else}
								<button type="button" class="link" onclick={() => (confirming = true)}
									>{nl.training.remove}</button
								>
							{/if}
						</div>
					{/if}
				</section>
			{/if}
		</div>
	</main>

	<footer>
		<p>{nl.footer.weights}</p>
		<p>{nl.footer.local}</p>
		<p>{nl.madeBy} <a href="https://kayhardam.dev">Kay Hardam</a></p>
	</footer>
</div>

<style>
	.wrap {
		max-width: 600px;
		margin: 0 auto;
		padding-left: max(16px, env(safe-area-inset-left, 0px));
		padding-right: max(16px, env(safe-area-inset-right, 0px));
	}
	.notice {
		background: var(--bad-soft);
		color: var(--bad);
		border-radius: 8px;
		padding: 10px 12px;
		font-size: 14px;
		margin-bottom: 12px;
	}
	.tabs {
		display: grid;
		grid-template-columns: 1fr 1fr;
		border-bottom: 2px solid var(--line);
		margin-top: 18px;
	}
	[role='tab'] {
		background: none;
		border: 0;
		border-bottom: 3px solid transparent;
		margin-bottom: -2px;
		padding: 10px 0;
		font: 700 17px/1.2 var(--f-display);
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--muted);
		cursor: pointer;
	}
	[role='tab'][aria-selected='true'] {
		color: var(--ink);
		border-bottom-color: var(--accent);
	}
	.training {
		display: grid;
		gap: 14px;
		padding-block: 16px 8px;
	}
	.date-row {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.date-row input {
		flex: 1;
		min-width: 0;
		height: 42px;
		border: 1px solid var(--line);
		border-radius: 8px;
		background: var(--surface);
		color: var(--ink);
		padding: 0 10px;
		font: 500 16px var(--f-body);
	}
	.hint {
		background: var(--sunk);
		border-radius: 8px;
		padding: 10px 12px;
		font-size: 14px;
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 12px;
	}
	.note {
		display: grid;
		gap: 6px;
	}
	.note textarea {
		width: 100%;
		min-height: 72px;
		border: 1px solid var(--line);
		border-radius: 8px;
		background: var(--surface);
		color: var(--ink);
		padding: 10px;
		font: 400 16px/1.4 var(--f-body);
		resize: vertical;
	}
	.remove {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		align-items: center;
		font-size: 14px;
	}
	.link {
		background: none;
		border: 0;
		padding: 6px 0;
		color: var(--muted);
		text-decoration: underline;
		cursor: pointer;
		font-size: 14px;
	}
	.danger {
		background: var(--bad);
		color: var(--surface);
		border: 0;
		border-radius: 6px;
		padding: 6px 12px;
		font-weight: 600;
		cursor: pointer;
	}
	footer {
		padding-block: 18px 28px;
		font-size: 13px;
		color: var(--muted);
		display: grid;
		gap: 4px;
	}
	footer a {
		color: var(--accent);
	}
</style>
