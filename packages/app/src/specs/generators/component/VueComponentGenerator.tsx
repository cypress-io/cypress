import { filters } from '../GeneratorsCommon'
import VueComponentGeneratorStepOne from './VueComponentGeneratorStepOne.vue'
import type { SpecGenerator } from '../types'
import ComponentGeneratorCard from './ComponentGeneratorCard.vue'

export const VueComponentGenerator: SpecGenerator = {
  card: ComponentGeneratorCard,
  entry: VueComponentGeneratorStepOne,
  show: (currentProject) => currentProject?.codeGenFramework === 'vue',
  matches: filters.matchesCT,
  id: 'vueComponent',
}
