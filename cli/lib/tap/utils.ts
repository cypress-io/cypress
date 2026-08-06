import { FrameCommandError } from './aut/frame'

// A flag's value is whatever text the shell handed over, so it is matched
// rather than coerced: `Number('')`, `Number('  7 ')`, `Number('0x10')` and
// `Number(['5'])` all produce integers a range check happily accepts.
const WHOLE_NUMBER = /^\d+$/

const parseWholeNumber = (raw: unknown): number | undefined => {
  return typeof raw === 'string' && WHOLE_NUMBER.test(raw) ? Number(raw) : undefined
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
