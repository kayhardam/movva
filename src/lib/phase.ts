/**
 * Where you are in the plan on a given day. Everything follows from the date
 * and the start date; nothing like "the current week" is ever stored, so it
 * can never drift out of step.
 */
import { addDays, daysBetween, mondayOf, type IsoDate } from './dates'
import type { Block, Plan, Range } from './plan/schema'

export interface Phase {
  /** 1 is the week the plan starts in. */
  week: number
  /** Index into plan.blocks. */
  blockIndex: number
  block: Block
  /** A light week: fewer sets, same weight. */
  light: boolean
  /** Before week 1, or past the last block (which then simply continues). */
  outside: 'before' | 'after' | null
  sets: number
  main: Range
  accessory: Range
  rir: Range
  monday: IsoDate
  sunday: IsoDate
}

export function phaseOf(plan: Plan, date: IsoDate): Phase {
  const monday = mondayOf(date)
  // Both dates are Mondays, so this is a whole number of weeks.
  const week = daysBetween(mondayOf(plan.start), monday) / 7 + 1

  const make = (blockIndex: number, light: boolean, outside: Phase['outside']): Phase => {
    const block = plan.blocks[blockIndex]
    if (!block) throw new RangeError('A plan needs at least one block')
    return {
      week: Math.max(1, week),
      blockIndex,
      block,
      light,
      outside,
      sets: light ? plan.sets.light : plan.sets.normal,
      main: block.main,
      accessory: block.accessory,
      rir: block.rir,
      monday,
      sunday: addDays(monday, 6),
    }
  }

  if (week < 1) return make(0, false, 'before')
  let first = 1
  for (const [i, block] of plan.blocks.entries()) {
    const last = first + block.weeks - 1
    if (week <= last) return make(i, false, null)
    if (block.deload && week === last + 1) return make(i, true, null)
    first = last + (block.deload ? 2 : 1)
  }
  return make(plan.blocks.length - 1, false, 'after')
}

/** The rep range for an exercise, given its role. */
export function repRange(phase: Pick<Phase, 'main' | 'accessory'>, role: 'main' | 'accessory'): Range {
  return role === 'main' ? phase.main : phase.accessory
}
