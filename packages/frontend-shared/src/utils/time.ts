const SECOND = 1
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY
// Average lengths, matching the CLDR-derived values the previous library used.
const MONTH = 30.44 * DAY
const YEAR = (146097 / 400) * DAY

// Ordered smallest-to-largest. The "second" unit is intentionally absent:
// sub-minute differences collapse to a "now" label, matching the previous
// library's default rounding style.
const UNITS: { unit: Intl.RelativeTimeFormatUnit, seconds: number }[] = [
  { unit: 'minute', seconds: MINUTE },
  { unit: 'hour', seconds: HOUR },
  { unit: 'day', seconds: DAY },
  { unit: 'week', seconds: WEEK },
  { unit: 'month', seconds: MONTH },
  { unit: 'year', seconds: YEAR },
]

// The threshold to round up into a unit sits half of the previous step's unit
// below it (`Math.round` semantics). The smallest step has no smaller unit, so
// it measures against itself: minutes begin at 30 seconds.
function stepThreshold (index: number): number {
  const { seconds } = UNITS[index]
  const prevSeconds = index === 0 ? seconds : UNITS[index - 1].seconds

  return seconds - prevSeconds / 2
}

const relativeTimeFormat = new Intl.RelativeTimeFormat('en-US', { numeric: 'always', style: 'long' })

export function getTimeAgo (iso8601: string): string {
  const secondsPassed = (Date.now() - new Date(iso8601).getTime()) / 1000
  const elapsed = Math.abs(secondsPassed)
  const isFuture = secondsPassed < 0

  if (elapsed < stepThreshold(0)) {
    return isFuture ? 'in a moment' : 'just now'
  }

  for (let i = UNITS.length - 1; i >= 0; i--) {
    if (elapsed >= stepThreshold(i)) {
      const { unit, seconds } = UNITS[i]
      const amount = Math.round(elapsed / seconds)

      return relativeTimeFormat.format(isFuture ? amount : -amount, unit)
    }
  }

  return isFuture ? 'in a moment' : 'just now'
}

export function getDurationString (totalSeconds: number): string {
  const roundedTotalSeconds = Math.floor(totalSeconds / 1000)
  const seconds = roundedTotalSeconds % 60
  const roundedTotalMinutes = Math.floor(roundedTotalSeconds / 60)
  const minutes = roundedTotalMinutes % 60
  const roundedTotalHours = Math.floor(roundedTotalMinutes / 60)
  const hours = roundedTotalHours % 60

  if (hours) {
    return `${hours}:${
    minutes.toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false })
    }:${
    seconds.toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false })
    }`
  }

  return `${
    minutes
    }:${
    seconds.toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false })
    }`
}
