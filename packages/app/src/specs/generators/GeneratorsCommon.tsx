import CreateSpecCard from '../CreateSpecCard.vue'
import type { TestingTypeEnum } from '../../generated/graphql'

export const CardWrapper = (props) => (<CreateSpecCard {...props} />)

export const filters = {
  matchesCT: (testingType: TestingTypeEnum) => testingType === 'component',
  matchesE2E: (testingType: TestingTypeEnum) => testingType === 'e2e',
}
