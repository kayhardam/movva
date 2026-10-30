import { describe, expect, it } from 'vitest'
import { advice } from './advice'
import type { LogEntry } from './log/schema'
import { phaseOf } from './phase'
import { defaultPlan } from './plan/default-plan'

const exercise = (id: string) => {
  const found = defaultPlan.exercises.find((e) => e.id === id)
  if (!found) throw new Error(`No exercise ${id}`)
  return found
}

/** A logged session with one exercise; week, block and light come from the date, like in the app. */
function logged(date: string, id: string, sets: [kg: number | null, reps: number][]): LogEntry {
  const phase = phaseOf(defaultPlan, date)
  const ex = exercise(id)
  return {
    type: 'strength',
    id: `${date}_t`,
    date,
    session: 't',
    week: phase.week,
    block: phase.blockIndex,
    light: phase.light,
    exercises: [{ id, name: ex.name, load: ex.load, sets: sets.map(([kg, reps]) => ({ kg, reps })) }],
    note: '',
    updated: `${date}T18:00:00.000Z`,
  }
}

const ask = (id: string, date: string, history: LogEntry[]) =>
  advice(defaultPlan, exercise(id), date, history)

describe('advice', () => {
  it('starts without a weight, and bodyweight at 0', () => {
    expect(ask('squat', '2026-10-26', [])).toMatchObject({
      kind: 'start',
      kg: null,
      last: null,
      target: { sets: 3, reps: [10, 12], rir: [2, 3], light: false },
    })
    expect(ask('pull-up', '2026-10-26', [])).toMatchObject({ kind: 'start', kg: 0 })
  })

  it('goes one step up once every set reaches the top', () => {
    const history = [logged('2026-10-26', 'squat', [[60, 12], [60, 12], [60, 12]])]
    expect(ask('squat', '2026-11-02', history)).toMatchObject({ kind: 'up', why: 'top-of-range', kg: 62.5 })
  })

  it('holds the weight until then', () => {
    const almost = [logged('2026-10-26', 'squat', [[60, 12], [60, 11], [60, 10]])]
    expect(ask('squat', '2026-11-02', almost)).toMatchObject({ kind: 'hold', why: 'reach-top', kg: 60 })
    const tooHeavy = [logged('2026-10-26', 'squat', [[60, 10], [60, 9], [60, 8]])]
    expect(ask('squat', '2026-11-02', tooHeavy)).toMatchObject({ kind: 'hold', why: 'reach-range', kg: 60 })
  })

  it('does not count a lighter back-off set as reaching the top', () => {
    const history = [logged('2026-10-26', 'squat', [[60, 12], [57.5, 12], [57.5, 12]])]
    expect(ask('squat', '2026-11-02', history)).toMatchObject({ kind: 'hold', kg: 60 })
  })

  it('uses the step of the exercise: dumbbells go up by 2 kg', () => {
    const history = [logged('2026-10-27', 'dumbbell-row', [[20, 12], [20, 12], [20, 12]])]
    expect(ask('dumbbell-row', '2026-11-03', history)).toMatchObject({ kind: 'up', kg: 22 })
  })

  it('keeps the weight but drops a set in a light week', () => {
    const history = [logged('2026-11-30', 'squat', [[70, 12], [70, 11], [70, 10]])]
    expect(ask('squat', '2026-12-07', history)).toMatchObject({
      kind: 'light',
      kg: 70,
      target: { sets: 2, light: true },
    })
  })

  it('skips the light week as a reference and starts a new block about 7.5% heavier', () => {
    const history = [
      logged('2026-11-30', 'squat', [[70, 12], [70, 11], [70, 10]]),
      logged('2026-12-07', 'squat', [[70, 12], [70, 12]]),
    ]
    const result = ask('squat', '2026-12-14', history)
    expect(result).toMatchObject({ kind: 'up', why: 'new-block', kg: 75, target: { reps: [8, 10] } })
    expect(result.last?.date).toBe('2026-12-07') // what you see as "last time" is still the light week
  })

  it('suggests the lat pulldown below 5 pull-ups', () => {
    const history = [logged('2026-10-26', 'pull-up', [[0, 1], [0, 1], [0, 1]])]
    expect(ask('pull-up', '2026-11-02', history)).toMatchObject({ kind: 'swap', to: 'lat-pulldown', kg: 0 })
  })

  it('counts reps only for roll-outs', () => {
    expect(ask('roll-out', '2026-10-29', [])).toMatchObject({ kind: 'start', kg: null })
    const history = [logged('2026-10-29', 'roll-out', [[null, 8], [null, 10], [null, 9]])]
    expect(ask('roll-out', '2026-11-05', history)).toMatchObject({ kind: 'hold', why: 'reps-only', best: 10 })
  })
})
