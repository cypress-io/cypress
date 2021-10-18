import { CardWrapper, filters } from '../GeneratorsCommon'
import { useI18n } from '@cy/i18n'
import { defineComponent } from 'vue'
import BookCodeIcon from '~icons/cy/book-code_x48';
import Entry from './Entry.vue'

const ImportFromStoryCard = defineComponent({
  setup: () => {
    const { t } = useI18n()
    return () => CardWrapper({
      header: t('createSpec.component.importFromStory.header'),
      description: t('createSpec.component.importFromStory.description'),
      icon: BookCodeIcon
    })
  }
})

export const ImportFromStoryGenerator = {
  card: ImportFromStoryCard,
  entry: Entry,
  matches: filters.matchesCT,
  id: 'import-from-story'
}
