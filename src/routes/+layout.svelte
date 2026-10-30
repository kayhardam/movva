<script lang="ts">
	// Fonts ship with the app instead of coming from Google Fonts, which would
	// hand every visitor's IP address to Google. Latin only: Dutch needs no more.
	import '@fontsource/barlow/latin-400.css';
	import '@fontsource/barlow/latin-600.css';
	import '@fontsource/barlow/latin-700.css';
	import '@fontsource/barlow-condensed/latin-600.css';
	import '@fontsource/barlow-condensed/latin-700.css';
	import '@fontsource/barlow-condensed/latin-800.css';
	import '@fontsource/saira-stencil-one/latin-400.css';
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="theme-color" content="#eceff1" media="(prefers-color-scheme: light)" />
	<meta name="theme-color" content="#111417" media="(prefers-color-scheme: dark)" />
</svelte:head>

{@render children()}
