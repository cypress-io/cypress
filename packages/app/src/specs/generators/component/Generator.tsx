import { CardWrapper, filters } from '../GeneratorsCommon'
import { useI18n } from '@cy/i18n'
import { defineComponent } from 'vue'
import DocumentCodeIcon from '~icons/cy/document-code_x48'
import Entry from './ComponentGeneratorStepOne.vue'
import type { SpecGenerator } from '../types'

const ImportFromComponentCard = defineComponent({
  setup () {
    const { t } = useI18n()

    return () => CardWrapper({
      icon: DocumentCodeIcon,
      header: t('createSpec.component.importFromComponent.header'),
      description: t('createSpec.component.importFromComponent.description'),
    })
  },
})

export const ImportFromComponentGenerator: SpecGenerator = {
  card: ImportFromComponentCard,
  entry: Entry,
  disabled: () => { },
  matches: filters.matchesCT,
  id: 'import-from-component',
}
