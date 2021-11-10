import type { SpecGenerator } from '../types'
import { filters } from '../GeneratorsCommon'
import EmptyGeneratorCard from './EmptyGeneratorCard.vue'
import EmptyGeneratorStepOne from './EmptyGeneratorStepOne.vue'
// import {CreateGeneratorWrapper} from '../CreateGeneratorWrapper'

export const EmptyGenerator: SpecGenerator = {
  card: EmptyGeneratorCard,
  entry: EmptyGeneratorStepOne,
  matches: filters.matchesE2E,
  disabled: () => { },
  id: 'empty-generator',
}
