import { filters } from '../GeneratorsCommon'
import ComponentGeneratorStepOne from './ComponentGeneratorStepOne.vue'
import type { SpecGenerator } from '../types'
import ComponentGeneratorCard from './ComponentGeneratorCard.vue'

export const ComponentGenerator: SpecGenerator = {
  card: ComponentGeneratorCard,
  entry: ComponentGeneratorStepOne,
  disabled: () => { },
  show: (currentProject) => {
    const specPattern = currentProject?.config.find((item) => item.field === 'specPattern')

    if (specPattern && specPattern.from !== 'default') {
      return false
    }

    return currentProject?.codeGenGlobs?.component === '*.vue'
  },
  matches: filters.matchesCT,
  id: 'component',
}
