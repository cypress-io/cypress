import { FrameCommandError } from './aut/frame'

// A flag's value is whatever text the shell handed over, so it is matched
// rather than coerced: `Number('')`, `Number('  7 ')`, `Number('0x10')` and
// `Number(['5'])` all produce integers a range check happily accepts.
const WHOLE_NUMBER = /^\d+$/

const parseWholeNumber = (raw: unknown): number | undefined => {
  if (typeof raw !== 'string' || !WHOLE_NUMBER.test(raw)) {
    return undefined
  }

  // A run of digits still overflows: past 2^53 `Number` silently rounds, and
  // far enough past it returns Infinity, which would disable the caps entirely.
  const value = Number(raw)

  return Number.isSafeInteger(value) ? value : undefined
}

/** `--at`: which match to read, 0-based. Absent means "the only match". */
export const parseIndex = (raw: string | undefined): number | undefined => {
  if (raw === undefined) {
    return undefined
  }

  const value = parseWholeNumber(raw)

  if (value === undefined) {
    throw new FrameCommandError('INVALID_INDEX', 'at must be a 0-based index: a whole number, 0 or greater')
  }

  return value
}

export const parsePositiveInt = (raw: string | undefined, fallback: number, label: string): number => {
  if (raw === undefined) {
    return fallback
  }

  const value = parseWholeNumber(raw)

  if (value === undefined || value <= 0) {
    throw new FrameCommandError('INVALID_LIMIT', `${label} must be a positive integer`)
  }

  return value
}
