import { TapError } from '@packages/cypress-instances'

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
    throw new TapError('INVALID_INDEX', { detail: `\`--at\` was given "${raw}".` })
  }

  return value
}

export const parsePositiveInt = (raw: string | undefined, fallback: number, label: string): number => {
  if (raw === undefined) {
    return fallback
  }

  const value = parseWholeNumber(raw)

  if (value === undefined || value <= 0) {
    throw new TapError('INVALID_LIMIT', { detail: `\`--${label}\` was given "${raw}".` })
  }

  return value
}
