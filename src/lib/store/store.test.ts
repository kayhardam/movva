import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { describe, expect, it } from 'vitest';
import type { LogEntry } from '../log/schema.ts';
import { localStore, memoryStore, type Store } from './store.ts';

let counter = 0;
const freshName = () => `movva-test-${++counter}`;

function entry(date: string, session = 'a', reps = 12): LogEntry {
	return {
		type: 'strength',
		id: `${date}_${session}`,
		date,
		session,
		week: 1,
		block: 0,
		light: false,
		exercises: [{ id: 'squat', name: 'Back squat', load: 'barbell', sets: [{ kg: 60, reps }] }],
		note: '',
		updated: `${date}T18:00:00.000Z`
	};
}

const stores: [string, () => Promise<Store>][] = [
	['IndexedDB', () => localStore(freshName())],
	['memory', async () => memoryStore()]
];

describe.each(stores)('%s store', (_kind, open) => {
	it('gives entries back oldest first', async () => {
		const store = await open();
		await store.put(entry('2026-11-02'));
		await store.put(entry('2026-10-26', 'b'));
		await store.put(entry('2026-10-26', 'a'));
		expect((await store.entries()).map((e) => e.id)).toEqual([
			'2026-10-26_a',
			'2026-10-26_b',
			'2026-11-02_a'
		]);
	});

	it('overwrites when the same training is saved again', async () => {
		const store = await open();
		await store.put(entry('2026-10-26', 'a', 10));
		await store.put(entry('2026-10-26', 'a', 12));
		const all = await store.entries();
		expect(all).toHaveLength(1);
		expect(all[0]?.type === 'strength' && all[0].exercises[0]?.sets[0]?.reps).toBe(12);
	});

	it('removes a training', async () => {
		const store = await open();
		await store.put(entry('2026-10-26'));
		await store.remove('2026-10-26_a');
		expect(await store.entries()).toEqual([]);
	});

	it('refuses to store an entry that does not pass the schema', async () => {
		const store = await open();
		await expect(store.put({ ...entry('2026-10-26'), id: 'wrong' })).rejects.toThrow();
		expect(await store.entries()).toEqual([]);
	});

	it('remembers what you left out per week', async () => {
		const store = await open();
		expect(await store.skipped('2026-10-26')).toEqual([]);
		await store.setSkipped('2026-10-26', ['wedstrijd']);
		expect(await store.skipped('2026-10-26')).toEqual(['wedstrijd']);
		expect(await store.skipped('2026-11-02')).toEqual([]);
	});
});

describe('IndexedDB store', () => {
	it('skips damaged records instead of failing to start', async () => {
		const name = freshName();
		const store = await localStore(name);
		await store.put(entry('2026-10-26'));

		// Something else (an old version, a browser extension) left junk in the same database.
		const raw = new Dexie(name);
		raw.version(1).stores({ entries: 'id, date', weeks: 'monday' });
		await raw.table('entries').put({ id: 'junk', date: 'not a date' });
		await raw.table('weeks').put({ monday: '2026-10-26', skip: '<script>' });
		raw.close();

		expect((await store.entries()).map((e) => e.id)).toEqual(['2026-10-26_a']);
		expect(await store.skipped('2026-10-26')).toEqual([]);
	});
});
