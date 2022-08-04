import type { SpecGenerator } from '../types'
import EmptyGeneratorCard from './EmptyGeneratorCard.vue'
import EmptyGeneratorCardStepOne from '../EmptyGenerator.vue'

export const EmptyGenerator: SpecGenerator = {
  card: EmptyGeneratorCard,
  entry: EmptyGeneratorCardStepOne,
  matches: () => true,
  show: (currentProject, isDefaultSpecPattern) => {
    if (!isDefaultSpecPattern) {
      return true
    }

    return currentProject?.codeGenGlobs?.component !== '*.vue'
  },
  id: 'empty',
}
