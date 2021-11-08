import type { SpecGenerator } from '../types'
import { filters } from '../GeneratorsCommon'
import StoryGeneratorStepOne from './StoryGeneratorStepOne.vue'
import StoryGeneratorCard from './StoryGeneratorCard.vue'

export const StoryGenerator: SpecGenerator = {
  card: StoryGeneratorCard,
  entry: StoryGeneratorStepOne,
  matches: filters.matchesCT,
  disabled: (activeProject) => {
    if (activeProject) {
      return !activeProject.storybook
    }

    return false
  },
  id: 'story-generator',
}
