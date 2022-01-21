import { filters } from '../GeneratorsCommon'
import ComponentGeneratorStepOne from './ComponentGeneratorStepOne.vue'
import type { SpecGenerator } from '../types'
import ComponentGeneratorCard from './ComponentGeneratorCard.vue'

export const ComponentGenerator: SpecGenerator = {
  card: ComponentGeneratorCard,
  entry: ComponentGeneratorStepOne,
  disabled: () => { },
  matches: filters.matchesCT,
  id: 'component',
}
