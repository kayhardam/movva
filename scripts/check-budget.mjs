// Checks the built app against size budgets. Run after `npm run build`:
//   node scripts/check-budget.mjs
//
// Sizes are in KB of 1000 bytes. JS, CSS and HTML are gzipped (zlib default
// level); fonts are counted raw, since woff2 is compressed already.
//
// Movva is opened on a phone in a gym, often with poor reception, so weight
// matters. Raise a budget only on purpose, and give the reason in the pull
// request. Each is a measured size plus a small margin.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

export const BUDGETS = {
	// 109.2 KB after module 2. The page itself is 73 KB, of which Zod is about
	// 29 KB and Dexie about 27 KB; Svelte and SvelteKit are about 30 KB.
	// The first lever if this needs to shrink: zod/mini, about 20 KB less.
	js: 112_000,
	css: 4_500, // 3.96 KB
	// Seven woff2 files, Latin only: Barlow 400/600/700, Barlow Condensed
	// 600/700/800, Saira Stencil One. Loaded once, then cached.
	fonts: 160_000, // 155.9 KB
	html: 1_000 // largest page, 0.62 KB: the app renders in the browser
};

function* files(dir) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) yield* files(path);
		else yield path;
	}
}

export function measure(dir = 'build') {
	const sizes = { js: 0, css: 0, fonts: 0, html: 0 };
	for (const path of files(dir)) {
		const bytes = readFileSync(path);
		if (path.endsWith('.js')) sizes.js += gzipSync(bytes).length;
		else if (path.endsWith('.css')) sizes.css += gzipSync(bytes).length;
		else if (path.endsWith('.woff2')) sizes.fonts += bytes.length;
		else if (path.endsWith('.html')) sizes.html = Math.max(sizes.html, gzipSync(bytes).length);
	}
	return sizes;
}

const sizes = measure();
const kb = (n) => (n / 1000).toFixed(1).padStart(6);
let over = false;
for (const [name, budget] of Object.entries(BUDGETS)) {
	const size = sizes[name];
	const ok = size <= budget;
	over ||= !ok;
	console.log(`${ok ? 'ok  ' : 'OVER'} ${name.padEnd(6)} ${kb(size)} KB of ${kb(budget)} KB`);
}
if (over) {
	console.error('\nOver budget. Shrink it, or raise the budget on purpose with the reason.');
	process.exit(1);
}
