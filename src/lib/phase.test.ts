import { describe, expect, it } from 'vitest'
import { phaseOf } from './phase'
import { defaultPlan } from './plan/default-plan'

// The dates from trainingsplan.md, checked one by one.
const cases = [
  ['2026-10-26', 1, 'Basis', false], // week 1 started on Monday 26 October
  ['2026-12-06', 6, 'Basis', false], // block 1 runs to 6 December
  ['2026-12-07', 7, 'Basis', true], // light week 7–13 December
  ['2026-12-14', 8, 'Opbouw', false], // block 2 from 14 December
  ['2027-01-25', 14, 'Opbouw', true], // light week 25–31 January
  ['2027-02-01', 15, 'Kracht', false], // block 3 from 1 February
  ['2027-03-14', 20, 'Kracht', false], // block 3 runs to 14 March
  ['2027-03-15', 21, 'Kracht', true], // light week 15–21 March
  ['2027-03-29', 23, 'Kracht', false], // the Monday after summer time starts
] as const

describe('phase', () => {
  it.each(cases)('%s is week %i, block %s, light %s', (date, week, block, light) => {
    const phase = phaseOf(defaultPlan, date)
    expect([phase.week, phase.block.name, phase.light]).toEqual([week, block, light])
  })

  it('uses the light-week sets and the block ranges', () => {
    expect(phaseOf(defaultPlan, '2026-12-09')).toMatchObject({
      sets: 2,
      main: [10, 12],
      accessory: [12, 15],
      monday: '2026-12-07',
      sunday: '2026-12-13',
    })
    expect(phaseOf(defaultPlan, '2027-02-03')).toMatchObject({ sets: 3, main: [6, 8], rir: [1, 2] })
  })

  it('carries on with the last block after the plan, and says so', () => {
    expect(phaseOf(defaultPlan, '2027-03-22')).toMatchObject({ week: 22, outside: 'after', light: false })
  })

  it('treats days before the start as week 1, and says so', () => {
    expect(phaseOf(defaultPlan, '2026-10-20')).toMatchObject({ week: 1, outside: 'before' })
  })

  it('works for a plan that starts mid-week, without light weeks', () => {
    const plan = {
      ...defaultPlan,
      start: '2026-11-04', // a Wednesday: week 1 is still Monday 2 to Sunday 8 November
      blocks: defaultPlan.blocks.map((b) => ({ ...b, weeks: 4, deload: false })),
    }
    expect(phaseOf(plan, '2026-11-02')).toMatchObject({ week: 1, blockIndex: 0 })
    expect(phaseOf(plan, '2026-11-30')).toMatchObject({ week: 5, blockIndex: 1, light: false })
  })
})
