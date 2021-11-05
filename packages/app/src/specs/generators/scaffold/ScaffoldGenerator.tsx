import type { SpecGenerator } from '../types'
import { filters } from '../GeneratorsCommon'
import ScaffoldGeneratorCard from './ScaffoldGeneratorCard.vue'

export const ScaffoldGenerator: SpecGenerator = {
  card: ScaffoldGeneratorCard,
  entry: ScaffoldGeneratorCard,
  matches: filters.matchesE2E,
  disabled: () => { },
  id: 'scaffold-generator',
}
