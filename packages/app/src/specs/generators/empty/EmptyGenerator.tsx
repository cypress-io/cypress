import type { SpecGenerator } from '../types'
import { filters } from '../GeneratorsCommon'
import EmptyGeneratorCard from './EmptyGeneratorCard.vue'
import EmptyGeneratorCardStepOne from './EmptyGeneratorCardStepOne.vue'

export const EmptyGenerator: SpecGenerator = {
  card: EmptyGeneratorCard,
  entry: EmptyGeneratorCardStepOne,
  matches: filters.matchesE2E,
  disabled: () => false,
  id: 'empty-generator',
}
