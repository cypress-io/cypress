import { CardWrapper, filters } from '../GeneratorsCommon'
import { useI18n } from '@cy/i18n'
import { defineComponent } from 'vue'
import BoxOpenIcon from '~icons/cy/box-open_x48'

const ImportFromScaffoldCard = defineComponent({
  setup: () => {
    const { t } = useI18n()

    return () => CardWrapper({
      icon: BoxOpenIcon,
      header: t('createSpec.e2e.importFromScaffold.header'),
      description: t('createSpec.e2e.importFromScaffold.description'),
    })
  },
})

export const ImportFromScaffoldGenerator = {
  card: ImportFromScaffoldCard,
  entry: ImportFromScaffoldCard,
  matches: filters.matchesE2E,
  disabled: () => { },
  id: 'import-from-scaffold',
}
