import { describe, expect, it } from 'vitest'
import { loadBar } from './plates'

const standard = [25, 20, 15, 10, 5, 2.5, 1.25]

describe('plate calculator', () => {
  it.each([
    [20, []],
    [40, [10]],
    [60, [20]],
    [62.5, [20, 1.25]],
    [100, [25, 15]],
    [102.5, [25, 15, 1.25]],
    [140, [25, 25, 10]],
  ])('%s kg on a 20 kg bar', (total, perSide) => {
    expect(loadBar(total, 20, standard)).toEqual({ perSide, missing: 0 })
  })

  it('says when the bar alone is too heavy', () => {
    expect(loadBar(15, 20, standard)).toBeNull()
  })

  it('says what is missing when the weight cannot be made exactly', () => {
    expect(loadBar(61, 20, standard)).toEqual({ perSide: [20], missing: 0.5 })
  })

  it('finds 10 + 10 where "heaviest plate first" would get stuck', () => {
    expect(loadBar(60, 20, [15, 10])).toEqual({ perSide: [10, 10], missing: 0 })
  })

  it('works with another bar and kilos that are awkward in floating point', () => {
    expect(loadBar(15 + 2 * 3.75, 15, [2.5, 1.25])).toEqual({ perSide: [2.5, 1.25], missing: 0 })
    expect(loadBar(20.2, 20, [0.1])).toEqual({ perSide: [0.1], missing: 0 })
  })
})
