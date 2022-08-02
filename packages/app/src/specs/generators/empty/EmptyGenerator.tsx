import type { SpecGenerator } from '../types'
import EmptyGeneratorCard from './EmptyGeneratorCard.vue'
import EmptyGeneratorCardStepOne from '../EmptyGenerator.vue'

export const EmptyGenerator: SpecGenerator = {
  card: EmptyGeneratorCard,
  entry: EmptyGeneratorCardStepOne,
  matches: () => true,
  disabled: () => false,
  show: (currentProject) => {
    const specPattern = currentProject?.config.find((item) => item.field === 'specPattern')

    return currentProject?.codeGenGlobs?.component !== '*.vue' || (specPattern && specPattern.from !== 'default')
  },
  id: 'empty',
}
