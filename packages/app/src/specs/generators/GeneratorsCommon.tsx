import type { TestingType } from '@packages/types'

export const filters = {
  matchesCT: (testingType: TestingType) => testingType === 'component',
  matchesE2E: (testingType: TestingType) => testingType === 'e2e',
}
