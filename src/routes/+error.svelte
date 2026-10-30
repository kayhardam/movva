<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>Movva</title>
</svelte:head>

<main>
	<p class="mark">Movva</p>
	{#if page.status === 404}
		<h1>Deze pagina bestaat niet.</h1>
	{:else}
		<h1>Er ging iets mis.</h1>
	{/if}
	<p><a href={resolve('/')}>Naar je training</a></p>
</main>

<style>
	main {
		max-width: 600px;
		margin: 0 auto;
		padding: 40px 16px;
		display: grid;
		gap: 12px;
	}
	.mark {
		font: 400 34px/1 var(--f-stencil);
		text-transform: uppercase;
	}
	h1 {
		font: 700 24px/1.2 var(--f-display);
		text-transform: uppercase;
	}
	a {
		color: var(--accent);
	}
</style>
