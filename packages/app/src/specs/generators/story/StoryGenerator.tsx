import type { SpecGenerator } from '../types'
import { filters } from '../GeneratorsCommon'
import StoryGeneratorStepOne from './StoryGeneratorStepOne.vue'
import StoryGeneratorCard from './StoryGeneratorCard.vue'

export const StoryGenerator: SpecGenerator = {
  card: StoryGeneratorCard,
  entry: StoryGeneratorStepOne,
  matches: filters.matchesCT,
  disabled: (currentProject) => {
    if (currentProject) {
      return !currentProject.storybook
    }

    return false
  },
  id: 'story',
}
