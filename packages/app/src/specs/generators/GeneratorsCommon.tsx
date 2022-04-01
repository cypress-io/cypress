import type { TestingType } from '@packages/types'

export const filters = {
  matchesCT: (testingType?: TestingType | null) => testingType === 'component',
  matchesE2E: (testingType?: TestingType | null) => testingType === 'e2e',
}
