/**
 * What gets logged. A logged training describes itself: it keeps the exercise
 * names and where you were in the plan, so editing the plan later never
 * rewrites history, and an exported file is readable on its own.
 */
import { z } from 'zod'
import type { IsoDate } from '../dates'
import { Id, IsoDateSchema, Load } from '../plan/schema'

/** One id per day per session or activity: saving again overwrites, never duplicates. */
export function entryId(date: IsoDate, ref: string): string {
  return `${date}_${ref}`
}

export const SetRow = z.object({
  /** Total, per dumbbell or extra weight, depending on the load; null without weight. */
  kg: z.number().min(0).max(999).nullable(),
  reps: z.int().min(1).max(99),
})
export type SetRow = z.infer<typeof SetRow>

const common = {
  id: z.string().max(80),
  date: IsoDateSchema,
  /** Where you were in the plan on that day. */
  week: z.int().min(1).max(520),
  block: z.int().min(0).max(7),
  light: z.boolean(),
  note: z.string().trim().max(2000).default(''),
  updated: z.iso.datetime(),
}

export const StrengthEntry = z
  .object({
    ...common,
    type: z.literal('strength'),
    session: Id,
    exercises: z
      .array(
        z.object({
          id: Id,
          name: z.string().trim().min(1).max(60),
          load: Load,
          sets: z.array(SetRow).min(1).max(10),
        }),
      )
      .max(12),
  })
  .refine((e) => e.id === entryId(e.date, e.session), { message: 'Id does not match date and session', path: ['id'] })
export type StrengthEntry = z.infer<typeof StrengthEntry>

export const ActivityEntry = z
  .object({
    ...common,
    type: z.literal('activity'),
    activity: Id,
    name: z.string().trim().min(1).max(40),
    minutes: z.int().min(0).max(600),
  })
  .refine((e) => e.id === entryId(e.date, e.activity), { message: 'Id does not match date and activity', path: ['id'] })
export type ActivityEntry = z.infer<typeof ActivityEntry>

export const LogEntry = z.discriminatedUnion('type', [StrengthEntry, ActivityEntry])
export type LogEntry = z.infer<typeof LogEntry>

/** Oldest first; on the same day by id, so the order never depends on how it was stored. */
export function byDate(a: LogEntry, b: LogEntry): number {
  return a.date < b.date ? -1 : a.date > b.date ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0
}
