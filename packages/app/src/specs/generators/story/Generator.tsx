import { CardWrapper, filters } from '../GeneratorsCommon'
import { useI18n } from '@cy/i18n'
import { defineComponent } from 'vue'
import BookCodeIcon from '~icons/cy/book-code_x48'
import StoryGeneratorStepOne from './StoryGeneratorStepOne.vue'

const ImportFromStoryCard = defineComponent({
  props: {
    disabled: {
      type: Boolean,
      optional: true,
    },
  },
  setup: (props) => {
    const { t } = useI18n()

    return () => CardWrapper({
      disabled: props.disabled,
      header: t('createSpec.component.importFromStory.header'),
      description: props.disabled ?
        t('createSpec.component.importFromStory.notSetupDescription') :
        t('createSpec.component.importFromStory.description'),
      icon: BookCodeIcon,
    })
  },
})

export const ImportFromStoryGenerator = {
  card: ImportFromStoryCard,
  entry: StoryGeneratorStepOne,
  matches: filters.matchesCT,
  disabled: (activeProject) => {
    if (activeProject) {
      return !activeProject.storybook
    }

    return false
  },
  id: 'import-from-story',
}
