import { defineConfig, devices } from '@playwright/test';

// The tests run against `wrangler dev`, which serves build/ the way production
// does: the same static assets and the same 404 handling.
// E2E_BASE_URL runs them against a deployed site instead, such as a preview URL.
const port = 8787;
const deployed = process.env.E2E_BASE_URL;

export default defineConfig({
	testDir: 'e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
	use: {
		baseURL: deployed ?? `http://127.0.0.1:${port}`,
		locale: 'nl-NL',
		timezoneId: 'Europe/Amsterdam',
		trace: 'retain-on-failure'
	},
	projects: [
		{ name: 'android', use: { ...devices['Pixel 7'] } },
		{ name: 'iphone', use: { ...devices['iPhone 15'] } }
	],
	webServer: deployed
		? undefined
		: {
				command: `npm run build && npx wrangler dev --ip 127.0.0.1 --port ${port} --show-interactive-dev-session=false --log-level warn`,
				url: `http://127.0.0.1:${port}/`,
				reuseExistingServer: !process.env.CI,
				timeout: 180_000,
				env: { WRANGLER_SEND_METRICS: 'false' }
			}
});
