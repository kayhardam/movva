import { describe, expect, it } from 'vitest'
import { planWeek } from './planner'
import { defaultPlan } from './plan/default-plan'
import type { Plan } from './plan/schema'

/** One id per day, '-' for an empty day, so a week reads like the table in trainingsplan.md. */
function layout(plan: Plan, skip: string[] = []): string[] {
  return planWeek(plan, { skip }).days.map((day) => day.map((p) => p.ref).join('+') || '-')
}

describe('week planner', () => {
  // The table from trainingsplan.md: handball is a choice per week.
  //                 Ma   Di   Wo   Do   Vr         Za   Zo
  it.each([
    ['training and match', [], ['a', 'b', '-', 'c', 'handbal', '-', 'wedstrijd']],
    ['training only', ['wedstrijd'], ['a', 'b', '-', 'c', 'handbal', 'd', '-']],
    ['match only', ['handbal'], ['a', 'b', '-', 'c', 'd', '-', 'wedstrijd']],
    ['no handball', ['handbal', 'wedstrijd'], ['a', 'b', '-', 'c', 'd', '-', 'intervallen']],
  ])('%s', (_name, skip, expected) => {
    expect(layout(defaultPlan, skip)).toEqual(expected)
  })

  it('explains why strength D drops in a week with training and a match', () => {
    const week = planWeek(defaultPlan)
    expect(week.dropped).toContainEqual({
      ref: 'd',
      slot: 5,
      why: 'no-free-day',
      tried: [
        { day: 4, why: 'busy' },
        { day: 5, why: 'before-match' },
      ],
    })
    expect(week.dropped).toContainEqual({ ref: 'intervallen', slot: 6, why: 'sport-this-week', tried: [] })
    expect(week.sport).toBe(true)
  })

  it('offers running as the alternative to intervals', () => {
    const sunday = planWeek(defaultPlan, { skip: ['handbal', 'wedstrijd'] }).days[6]
    expect(sunday).toEqual([{ ref: 'intervallen', alternatives: ['hardlopen'], slot: 6 }])
  })

  it('works the same for another sport: football with two trainings and a Saturday match', () => {
    const football: Plan = {
      ...defaultPlan,
      restDays: [6],
      activities: [
        { id: 'training', label: 'T', name: 'Training', kind: 'sport', tips: [] },
        { id: 'match', label: 'W', name: 'Wedstrijd', kind: 'match', tips: [] },
      ],
      week: [
        { refs: ['training'], days: [1], optional: false, notBeforeMatch: false, onlyWithoutSport: false },
        { refs: ['training'], days: [3], optional: false, notBeforeMatch: false, onlyWithoutSport: false },
        { refs: ['match'], days: [5], optional: true, notBeforeMatch: false, onlyWithoutSport: false },
        { refs: ['a'], days: [0], optional: false, notBeforeMatch: false, onlyWithoutSport: false },
        { refs: ['b'], days: [4, 2], optional: false, notBeforeMatch: true, onlyWithoutSport: false },
      ],
    }
    // B prefers Friday, but that is the day before the match, so it moves to Wednesday.
    expect(layout(football)).toEqual(['a', 'training', 'b', 'training', '-', 'match', '-'])
    // In a week without a match, B gets its Friday back.
    expect(layout(football, ['match'])).toEqual(['a', 'training', '-', 'training', 'b', '-', '-'])
  })
})
