import type { SpecGenerator } from '../types'
import EmptyGeneratorCard from './EmptyGeneratorCard.vue'
import EmptyGeneratorCardStepOne from '../EmptyGenerator.vue'

export const EmptyGenerator: SpecGenerator = {
  card: EmptyGeneratorCard,
  entry: EmptyGeneratorCardStepOne,
  matches: () => true,
  disabled: () => false,
  id: 'empty',
}
