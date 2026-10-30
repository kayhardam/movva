<script lang="ts">
	import type { Movva } from '#lib/app.svelte.ts';
	import { nl } from '#lib/i18n/nl.ts';

	let { app }: { app: Movva } = $props();

	const canWake = typeof navigator !== 'undefined' && 'wakeLock' in navigator;
	let awake = $state(false);
	let lock: WakeLockSentinel | null = null;

	async function acquire() {
		try {
			lock = await navigator.wakeLock.request('screen');
			lock.addEventListener('release', () => (lock = null));
		} catch {
			awake = false;
		}
	}

	function toggle() {
		awake = !awake;
		if (awake) void acquire();
		else {
			void lock?.release();
			lock = null;
		}
	}

	// The browser lets go of the lock when the page is hidden; take it back on return.
	function onvisibilitychange() {
		if (document.visibilityState === 'visible' && awake && !lock) void acquire();
	}
</script>

<svelte:document {onvisibilitychange} />

<header>
	<div class="brand">
		<h1 class="mark">{nl.app.name}</h1>
		<p class="sub">{nl.app.tagline}</p>
	</div>
	<div class="tools">
		{#if canWake}
			<button type="button" class={['chip', awake && 'on']} aria-pressed={awake} onclick={toggle}>
				{nl.wake}
			</button>
		{/if}
		{#if app.status === 'error'}
			<button type="button" class="status" data-s="error" onclick={() => app.flush()}>
				<span class="dot" aria-hidden="true"></span>{nl.status.error}
			</button>
		{:else}
			<p class="status" data-s={app.status} role="status">
				<span class="dot" aria-hidden="true"></span>{nl.status[app.status]}
			</p>
		{/if}
	</div>
</header>

<style>
	header {
		padding-block: 18px 10px;
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
	}
	.brand {
		display: grid;
		gap: 2px;
	}
	.mark {
		font: 400 34px/1 var(--f-stencil);
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}
	.sub {
		font: 600 15px/1.2 var(--f-display);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--muted);
	}
	.tools {
		display: flex;
		gap: 10px;
		align-items: center;
		flex-wrap: wrap;
	}
	.chip {
		border: 1px solid var(--line);
		background: var(--surface);
		border-radius: 999px;
		padding: 5px 11px;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
	}
	.chip.on {
		background: var(--ink);
		color: var(--bg);
		border-color: var(--ink);
	}
	.status {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		border: 0;
		background: none;
		padding: 6px 0;
		font-size: 13px;
		color: var(--muted);
	}
	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--line);
	}
	.status[data-s='saved'] .dot,
	.status[data-s='ready'] .dot {
		background: var(--go);
	}
	.status[data-s='saving'] .dot,
	.status[data-s='dirty'] .dot,
	.status[data-s='loading'] .dot {
		background: var(--light);
	}
	.status[data-s='error'],
	.status[data-s='memory'] {
		color: var(--bad);
	}
	.status[data-s='error'] .dot,
	.status[data-s='memory'] .dot {
		background: var(--bad);
	}
	button.status {
		cursor: pointer;
		text-decoration: underline;
	}
</style>
