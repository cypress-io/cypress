import { filters } from '../GeneratorsCommon'
import ReactComponentGeneratorStepOne from './ReactComponentGeneratorStepOne.vue'
import type { SpecGenerator } from '../types'
import ComponentGeneratorCard from './ComponentGeneratorCard.vue'

export const ReactComponentGenerator: SpecGenerator = {
  card: ComponentGeneratorCard,
  entry: ReactComponentGeneratorStepOne,
  show: (currentProject) => currentProject?.codeGenFramework === 'react',
  matches: filters.matchesCT,
  id: 'reactComponent',
}
