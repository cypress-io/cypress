import type { SpecGenerator } from '../types'
import { filters } from '../GeneratorsCommon'
import ScaffoldGeneratorCard from './ScaffoldGeneratorCard.vue'
import ScaffoldGeneratorStepOne from './ScaffoldGeneratorStepOne.vue'

export const ScaffoldGenerator: SpecGenerator = {
  card: ScaffoldGeneratorCard,
  entry: ScaffoldGeneratorStepOne,
  matches: filters.matchesE2E,
  disabled: () => { },
  id: 'scaffold',
}
