import { FrameCommandError } from './aut/frame'

const WHOLE_NUMBER = /^\d+$/

const parseWholeNumber = (raw: unknown): number | undefined => {
  if (typeof raw !== 'string' || !WHOLE_NUMBER.test(raw)) {
    return undefined
  }

  const value = Number(raw)

  return Number.isSafeInteger(value) ? value : undefined
}

export const parseIndex = (raw: string | undefined): number | undefined => {
  if (raw === undefined) {
    return undefined
  }

  const value = parseWholeNumber(raw)

  if (value === undefined) {
    throw new FrameCommandError('INVALID_INDEX', '--at must be a 0-based index: a whole number, 0 or greater')
  }

  return value
}

export const parsePositiveInt = (raw: string, label: string): number => {
  const value = parseWholeNumber(raw)

  if (value === undefined || value <= 0) {
    throw new FrameCommandError('INVALID_LIMIT', `${label} must be a positive integer`)
  }

  return value
}
