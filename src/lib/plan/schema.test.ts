import { describe, expect, it } from 'vitest'
import { defaultPlan } from './default-plan'
import { parsePlan, type PlanInput } from './schema'

/** A copy of the default plan to break things in. */
function copy(): PlanInput {
  return structuredClone(defaultPlan)
}

function errorsOf(input: unknown): string[] {
  const result = parsePlan(input)
  return result.ok ? [] : result.errors
}

describe('plan schema', () => {
  it("accepts Kay's plan, also after a trip through JSON (as in a link)", () => {
    const result = parsePlan(JSON.parse(JSON.stringify(defaultPlan)))
    expect(result).toEqual({ ok: true, value: defaultPlan })
  })

  it('fills in defaults for what a short plan leaves out', () => {
    const { sets, equipment, ...rest } = copy()
    const result = parsePlan(rest)
    expect(result.ok && result.value.sets).toEqual({ normal: 3, light: 2 })
    expect(result.ok && result.value.equipment.bar).toBe(20)
  })

  it('points at an exercise that does not exist', () => {
    const plan = copy()
    plan.sessions[0]!.exercises.push('kettlebell-swing')
    expect(errorsOf(plan)).toEqual(['sessions.0.exercises.6: Unknown exercise "kettlebell-swing"'])
  })

  it('refuses a session on the rest day', () => {
    const plan = copy()
    plan.week[0]!.days = [2]
    expect(errorsOf(plan)).toEqual(['week.0.days.0: This day is a rest day'])
  })

  it('refuses an id that a session and an activity share', () => {
    const plan = copy()
    plan.activities[0]!.id = 'a'
    expect(errorsOf(plan)).toContain('activities.0.id: Id "a" appears twice')
  })

  it('keeps markup out of ids, which end up in attributes and links', () => {
    const plan = copy()
    plan.exercises[0]!.id = '"><img src=x onerror=alert(1)>'
    expect(errorsOf(plan).some((e) => e.startsWith('exercises.0.id:'))).toBe(true)
  })

  it('refuses impossible numbers', () => {
    const plan = copy()
    plan.blocks[0]!.main = [12, 10]
    plan.exercises[0]!.step = -2.5
    expect(errorsOf(plan)).toHaveLength(2)
  })

  it('does not trip over something that is not a plan at all', () => {
    expect(parsePlan(null).ok).toBe(false)
    expect(parsePlan({ v: 1, name: 'Leeg' }).ok).toBe(false)
    expect(parsePlan({ ...copy(), v: 2 }).ok).toBe(false)
  })
})
