import type { TestingTypeEnum } from '../../generated/graphql'

export const filters = {
  matchesCT: (testingType: TestingTypeEnum) => testingType === 'component',
  matchesE2E: (testingType: TestingTypeEnum) => testingType === 'e2e',
}
