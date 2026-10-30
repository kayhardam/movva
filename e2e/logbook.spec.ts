// The acceptance criteria of module 2 (docs/modules/02-logboek.md), on a phone.
import { expect, test, type Page } from '@playwright/test';

// Friday 30 October 2026, week 1 of Kay's plan, so every run sees the same week.
const NOW = new Date('2026-10-30T10:00:00+01:00');

test.beforeEach(async ({ page }) => {
	await page.clock.setFixedTime(NOW);
	await page.goto('/');
	await expect(page.getByRole('status')).toHaveText(/Klaar/);
});

async function openDate(page: Page, date: string) {
	const field = page.getByLabel('Datum');
	await field.fill(date);
	await field.dispatchEvent('change');
}

async function logSquats(page: Page, kg: string, reps: string[]) {
	for (const [i, r] of reps.entries()) {
		await page.getByLabel(`Back squat, set ${i + 1}, Kg`).fill(kg);
		await page.getByLabel(`Back squat, set ${i + 1}, Herh.`).fill(r);
	}
	await expect(page.getByRole('status')).toHaveText('Bewaard');
}

test('a logged training is still there after a reload', async ({ page }) => {
	await openDate(page, '2026-10-26');
	await page.getByRole('button', { name: /^A/ }).click();
	await logSquats(page, '60', ['12', '11', '10']);
	await page.getByLabel('Notitie').fill('Eerste keer in Movva');
	await expect(page.getByRole('status')).toHaveText('Bewaard');

	await page.reload();
	await expect(page.getByRole('status')).toHaveText(/Klaar/);
	await openDate(page, '2026-10-26');
	await expect(page.getByLabel('Back squat, set 3, Herh.')).toHaveValue('10');
	await expect(page.getByLabel('Notitie')).toHaveValue('Eerste keer in Movva');
});

test('every set at the top means one step heavier next time', async ({ page }) => {
	await openDate(page, '2026-10-26');
	await page.getByRole('button', { name: /^A/ }).click();
	await logSquats(page, '60', ['12', '12', '12']);

	await openDate(page, '2026-11-02');
	for (const i of [1, 2, 3])
		await expect(page.getByLabel(`Back squat, set ${i}, Kg`)).toHaveValue('62,5');
	await expect(page.getByText('Alle sets op 12: 2,5 kg zwaarder')).toBeVisible();
});

test('strength D drops in a week with training and a match, with the reason', async ({ page }) => {
	await expect(
		page.getByText('Kracht D vervalt deze week: vrijdag bezet, zaterdag dag voor de wedstrijd.')
	).toBeVisible();
	await page.getByRole('checkbox', { name: 'Wedstrijd' }).uncheck();
	await expect(page.getByRole('button', { name: /^za 31 okt/ })).toContainText('D');
	await expect(page.getByText(/Kracht D vervalt/)).toHaveCount(0);
});

for (const colorScheme of ['light', 'dark'] as const) {
	test(`nothing sticks out sideways, ${colorScheme}`, async ({ page }) => {
		await page.emulateMedia({ colorScheme });
		await page.getByRole('button', { name: /^A/ }).click();
		const width = await page.evaluate(() => document.documentElement.scrollWidth);
		expect(width).toBeLessThanOrEqual(page.viewportSize()?.width ?? 0);
	});
}
