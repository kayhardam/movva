/**
 * Which plates go on each side of the bar.
 *
 * The old logbook took the heaviest plate that fit, again and again. That is
 * right for the standard set of 25/20/15/10/5/2.5/1.25, but not for any set:
 * with only 15s and 10s, 20 kg per side is 10 + 10, while "heaviest first"
 * gets stuck at 15. Now that the plates are part of the plan, this looks for
 * the fewest plates instead, and on a tie for the heaviest ones.
 *
 * It counts in grams, because 2.5 + 1.25 + 0.1 in floating point is not
 * always what you'd write down.
 */

export interface Loading {
  /** The plates for one side, heaviest first. */
  perSide: number[]
  /** Kilograms per side these plates can't make; 0 when the weight is exact. */
  missing: number
}

const grams = (kg: number) => Math.round(kg * 1000)
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))

/** Plates per side for a total weight on the bar, or null when the total is below the bar. */
export function loadBar(total: number, bar: number, plates: readonly number[]): Loading | null {
  const bothSides = grams(total) - grams(bar)
  if (bothSides < 0) return null
  const target = Math.floor(bothSides / 2)
  const sizes = [...new Set(plates.map(grams))].filter((p) => p > 0).sort((a, b) => b - a)
  if (sizes.length === 0) return { perSide: [], missing: target / 1000 }

  // Work in units of the largest common divisor: the standard set needs 18 steps for 22.5 kg.
  const unit = sizes.reduce(gcd)
  const steps = Math.floor(target / unit)
  const fewest = new Array<number>(steps + 1).fill(Infinity)
  const lastPlate = new Array<number>(steps + 1).fill(0)
  fewest[0] = 0
  for (let i = 1; i <= steps; i++) {
    for (const size of sizes) {
      const before = i - size / unit
      // Heaviest plates come first, and only a strictly better count replaces them.
      if (before >= 0 && fewest[before]! + 1 < fewest[i]!) {
        fewest[i] = fewest[before]! + 1
        lastPlate[i] = size
      }
    }
  }

  let reached = steps
  while (fewest[reached] === Infinity) reached--
  const perSide: number[] = []
  for (let i = reached; i > 0; i -= lastPlate[i]! / unit) perSide.push(lastPlate[i]! / 1000)
  perSide.sort((a, b) => b - a)
  return { perSide, missing: (target - reached * unit) / 1000 }
}
