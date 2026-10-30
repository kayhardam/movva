import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			// Static files for now: no server yet. Accounts and sync later mean a server adapter.
			// 404.html is the app shell for any address without its own page; Cloudflare
			// serves it with status 404 (see wrangler.jsonc).
			adapter: adapter({ fallback: '404.html' })
		})
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					// Run in Dutch time, so the daylight saving switches really happen in the tests.
					env: { TZ: 'Europe/Amsterdam' }
				}
			}
		]
	}
});
