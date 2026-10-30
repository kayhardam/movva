/**
 * Calendar dates as 'YYYY-MM-DD' strings.
 *
 * Why strings: they sort correctly as text, they are what <input type="date">
 * gives you, and they mean "a day on the calendar", not "a moment in time".
 *
 * Why the arithmetic runs on Date.UTC: a local day is not always 24 hours.
 * On the nights the clocks change it lasts 23 or 25 hours, and counting days
 * by dividing milliseconds then comes out a fraction short or long.
 * UTC has no daylight saving time, so counting calendar days there is exact.
 */

/** 0 = Monday … 6 = Sunday (ISO order; Date.getDay() starts on Sunday). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

/** A calendar day as 'YYYY-MM-DD'. */
export type IsoDate = string

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/
const DAY_MS = 86_400_000

function parts(date: IsoDate): [number, number, number] {
  const m = ISO.exec(date)
  if (!m) throw new RangeError(`Not a date: ${date}`)
  return [Number(m[1]), Number(m[2]), Number(m[3])]
}

function utc(date: IsoDate): number {
  const [y, m, d] = parts(date)
  return Date.UTC(y, m - 1, d)
}

function fromUtc(ms: number): IsoDate {
  return new Date(ms).toISOString().slice(0, 10)
}

/** True for a real calendar day such as 2028-02-29, false for 2027-02-29 or 2026-13-01. */
export function isIsoDate(value: string): boolean {
  if (!ISO.test(value)) return false
  return fromUtc(utc(value)) === value
}

/** Today in the visitor's own time zone. */
export function today(now: Date = new Date()): IsoDate {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function addDays(date: IsoDate, days: number): IsoDate {
  return fromUtc(utc(date) + days * DAY_MS)
}

/** Whole calendar days from a to b; negative when b comes first. */
export function daysBetween(a: IsoDate, b: IsoDate): number {
  return (utc(b) - utc(a)) / DAY_MS
}

export function weekday(date: IsoDate): Weekday {
  return ((new Date(utc(date)).getUTCDay() + 6) % 7) as Weekday
}

export function mondayOf(date: IsoDate): IsoDate {
  return addDays(date, -weekday(date))
}
