/**
 * The coach: what to lift today, from what you did last time.
 *
 * Old-school double progression. Build reps within the range; once every set
 * reaches the top, go one step heavier. A new block starts about 7.5% heavier.
 * Light weeks don't count as a reference, so a deload never resets your build-up.
 *
 * It returns reasons, not sentences: the screen turns them into Dutch or English.
 */
import type { IsoDate } from './dates'
import type { LogEntry, SetRow, StrengthEntry } from './log/schema'
import { phaseOf, repRange } from './phase'
import type { Exercise, Plan, Range } from './plan/schema'

/** Fewer reps than this on a bodyweight exercise: switch to its alternative and build there. */
export const MIN_BODYWEIGHT_REPS = 5
/** How much heavier a new block starts. */
export const NEW_BLOCK_INCREASE = 0.075

export type AdviceKind = 'start' | 'light' | 'up' | 'hold' | 'swap'
export type AdviceReason =
  | 'first-time'
  | 'light-week'
  | 'top-of-range'
  | 'new-block'
  | 'reach-range'
  | 'reach-top'
  | 'too-few-reps'
  | 'reps-only'

export interface Advice {
  kind: AdviceKind
  why: AdviceReason
  /** Suggested weight; null when there is nothing sensible to suggest yet. */
  kg: number | null
  /** Reps-only exercises: the best set last time. */
  best?: number
  /** With kind 'swap': the exercise to switch to. */
  to?: string
  /** The last time, light weeks included: what you see as "last time". */
  last: { date: IsoDate; sets: SetRow[] } | null
  /** What to aim for today. */
  target: { sets: number; reps: Range; rir: Range; light: boolean }
}

interface Found {
  entry: StrengthEntry
  sets: SetRow[]
}

/** The most recent sets of an exercise before a date. History is sorted oldest first. */
function previous(
  history: readonly LogEntry[],
  exerciseId: string,
  before: IsoDate,
  skipLight: boolean,
): Found | null {
  for (let i = history.length - 1; i >= 0; i--) {
    const entry = history[i]
    if (!entry || entry.type !== 'strength' || entry.date >= before) continue
    if (skipLight && entry.light) continue
    const sets = entry.exercises.find((e) => e.id === exerciseId)?.sets
    if (sets && sets.length > 0) return { entry, sets }
  }
  return null
}

const round = (kg: number) => Math.round(kg * 1000) / 1000

export function advice(
  plan: Plan,
  exercise: Exercise,
  date: IsoDate,
  history: readonly LogEntry[],
): Advice {
  const phase = phaseOf(plan, date)
  const reps = repRange(phase, exercise.role)
  const target = { sets: phase.sets, reps, rir: phase.rir, light: phase.light }
  const seen = previous(history, exercise.id, date, false)
  const last = seen ? { date: seen.entry.date, sets: seen.sets } : null
  const say = (
    kind: AdviceKind,
    why: AdviceReason,
    kg: number | null,
    extra: Pick<Advice, 'best' | 'to'> = {},
  ): Advice => ({ kind, why, kg, last, target, ...extra })

  if (exercise.load === 'reps') {
    if (phase.light) return say('light', 'light-week', null)
    if (!last) return say('start', 'first-time', null)
    return say('hold', 'reps-only', null, { best: Math.max(...last.sets.map((s) => s.reps)) })
  }

  const ref = previous(history, exercise.id, date, true)
  if (!ref) {
    const kg = exercise.load === 'bodyweight' ? 0 : null
    return say(phase.light ? 'light' : 'start', phase.light ? 'light-week' : 'first-time', kg)
  }

  const working = ref.sets[0]?.kg ?? 0
  if (phase.light) return say('light', 'light-week', working)

  const maxReps = Math.max(...ref.sets.map((s) => s.reps))
  if (exercise.load === 'bodyweight' && exercise.swap && maxReps < MIN_BODYWEIGHT_REPS)
    return say('swap', 'too-few-reps', working, { to: exercise.swap })

  if (ref.entry.block < phase.blockIndex) {
    // Bodyweight can't go up by a percentage: first reach the top of the new range.
    if (exercise.load === 'bodyweight') return say('hold', 'new-block', working)
    let kg = round(Math.round((working * (1 + NEW_BLOCK_INCREASE)) / exercise.step) * exercise.step)
    if (kg <= working) kg = round(working + exercise.step)
    return say('up', 'new-block', kg)
  }

  // Judge last time by the range that applied then.
  const thenReps = repRange(plan.blocks[ref.entry.block] ?? phase.block, exercise.role)
  const top =
    ref.sets.length >= plan.sets.normal &&
    ref.sets.every((s) => s.reps >= thenReps[1] && (s.kg ?? 0) >= working)
  if (top) return say('up', 'top-of-range', round(working + exercise.step))

  const belowRange = ref.sets.some((s) => s.reps < reps[0])
  return say('hold', belowRange ? 'reach-range' : 'reach-top', working)
}
