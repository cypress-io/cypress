import { CardWrapper, filters } from '../GeneratorsCommon'
import { useI18n } from '@cy/i18n'
import { defineComponent } from 'vue'
import DocumentCodeIcon from '~icons/cy/document-code_x48'

const ImportEmptySpecCard = defineComponent({
  setup: () => {
    const { t } = useI18n()

    return () => CardWrapper({
      icon: DocumentCodeIcon,
      header: t('createSpec.e2e.importEmptySpec.header'),
      description: t('createSpec.e2e.importEmptySpec.description'),
    })
  },
})

export const ImportEmptySpecGenerator = {
  card: ImportEmptySpecCard,
  entry: ImportEmptySpecCard,
  matches: filters.matchesE2E,
  disabled: () => { },
  id: 'import-from-empty',
}
