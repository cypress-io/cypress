import type { SpecGenerator } from '../types'
import { filters } from '../GeneratorsCommon'
import EmptyGeneratorCard from './EmptyGeneratorCard.vue'

export const EmptyGenerator: SpecGenerator = {
  card: EmptyGeneratorCard,
  entry: EmptyGeneratorCard,
  matches: filters.matchesE2E,
  disabled: () => { },
  id: 'empty',
}
