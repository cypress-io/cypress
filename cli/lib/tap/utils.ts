import { FrameCommandError } from './aut/frame'

/** `--at`: which match to read, 0-based. Absent means "the only match". */
export const parseIndex = (raw: string | undefined): number | undefined => {
  if (raw === undefined) {
    return undefined
  }

  const value = Number(raw)

  if (!Number.isInteger(value) || value < 0) {
    throw new FrameCommandError('INVALID_INDEX', 'at must be a 0-based index: a whole number, 0 or greater')
  }

  return value
}

export const parsePositiveInt = (raw: string | undefined, fallback: number, label: string): number => {
  if (raw === undefined) {
    return fallback
  }

  const value = Number(raw)

  if (!Number.isInteger(value) || value <= 0) {
    throw new FrameCommandError('INVALID_LIMIT', `${label} must be a positive integer`)
  }

  return value
}
