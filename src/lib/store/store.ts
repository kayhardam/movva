/**
 * Where Movva keeps what you log.
 *
 * The screens only know this interface. Today it is IndexedDB in your own
 * browser; syncing with an account later is a second implementation of the
 * same interface, not a rewrite of the screens.
 */
import Dexie, { type Table } from 'dexie';
import { z } from 'zod';
import type { IsoDate } from '../dates.ts';
import { byDate, LogEntry } from '../log/schema.ts';
import { Id, IsoDateSchema } from '../plan/schema.ts';

export interface Store {
	/** 'local' keeps everything in this browser; 'memory' loses it on reload. */
	readonly kind: 'local' | 'memory';
	/** Every valid entry, oldest first. A damaged record is skipped, never thrown. */
	entries(): Promise<LogEntry[]>;
	/** Adds or replaces the entry with this id. */
	put(entry: LogEntry): Promise<void>;
	remove(id: string): Promise<void>;
	/** Optional sessions or activities left out in the week that starts on this Monday. */
	skipped(monday: IsoDate): Promise<string[]>;
	setSkipped(monday: IsoDate, refs: string[]): Promise<void>;
}

const WeekRow = z.object({ monday: IsoDateSchema, skip: z.array(Id).max(14) });
type WeekRow = z.infer<typeof WeekRow>;

/** Keep what passes the schema; storage written by an older version may not. */
function valid(rows: unknown[]): LogEntry[] {
	return rows
		.flatMap((row) => {
			const parsed = LogEntry.safeParse(row);
			return parsed.success ? [parsed.data] : [];
		})
		.sort(byDate);
}

class MovvaDb extends Dexie {
	entries!: Table<unknown, string>;
	weeks!: Table<unknown, string>;

	constructor(name: string) {
		super(name);
		// Each schema change gets a new version number with an upgrade step; never edit this one.
		this.version(1).stores({ entries: 'id, date', weeks: 'monday' });
	}
}

/** IndexedDB through Dexie. Throws when the browser has no IndexedDB available. */
export async function localStore(name = 'movva'): Promise<Store> {
	const db = new MovvaDb(name);
	await db.open();
	return {
		kind: 'local',
		entries: async () => valid(await db.entries.toArray()),
		put: async (entry) => {
			await db.entries.put(LogEntry.parse(entry));
		},
		remove: (id) => db.entries.delete(id),
		skipped: async (monday) => {
			const row = WeekRow.safeParse(await db.weeks.get(monday));
			return row.success ? row.data.skip : [];
		},
		setSkipped: async (monday, refs) => {
			await db.weeks.put(WeekRow.parse({ monday, skip: refs } satisfies WeekRow));
		}
	};
}

/** Keeps everything in memory: for tests, and as a fallback when IndexedDB is unavailable. */
export function memoryStore(): Store {
	const entries = new Map<string, LogEntry>();
	const weeks = new Map<IsoDate, string[]>();
	return {
		kind: 'memory',
		entries: async () => valid([...entries.values()]),
		put: async (entry) => {
			const parsed = LogEntry.parse(entry);
			entries.set(parsed.id, parsed);
		},
		remove: async (id) => {
			entries.delete(id);
		},
		skipped: async (monday) => weeks.get(monday) ?? [],
		setSkipped: async (monday, refs) => {
			weeks.set(monday, [...refs]);
		}
	};
}

/** The store for this browser: IndexedDB when it works, otherwise memory. */
export async function openStore(): Promise<Store> {
	try {
		return await localStore();
	} catch {
		return memoryStore();
	}
}
