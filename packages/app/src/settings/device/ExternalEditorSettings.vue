<template>
  <SettingsSection>
    <template #title>
      {{ t('settingsPage.editor.title') }}
    </template>
    <template #description>
      {{ t('settingsPage.editor.description') }}
    </template>
    <Select
      :model-value="selectedEditor"
      :options="externalEditors"
      item-value="name"
      item-key="id"
      :placeholder="t('settingsPage.editor.noEditorSelectedPlaceholder')"
      class="w-300px"
      @update:model-value="updateEditor"
    >
      <template #input-prefix="{ value }">
        <Icon
          v-if="value"
          :icon="icons[value.id]"
          class="text-md"
        />
        <Icon
          v-else
          n="IconTerminal"
          class="text-gray-600 text-md"
        />
      </template>
      <template #item-prefix="{ value }">
        <Icon
          :icon="value.icon"
          class="text-md"
        />
      </template>
    </Select>
  </SettingsSection>
</template>

<script lang="ts" setup>
import { computed, FunctionalComponent, ref, SVGAttributes, watchEffect } from 'vue'
import Icon from '@cy/components/Icon.vue'
import SettingsSection from '../SettingsSection.vue'
import { useI18n } from '@cy/i18n'
import Select from '@cy/components/Select.vue'
import VSCode from '~icons/logos/visual-studio-code'
import Atom from '~icons/logos/atom-icon'
import Webstorm from '~icons/logos/webstorm'
import Vim from '~icons/logos/vim'
import Sublime from '~icons/logos/sublimetext-icon'
import Emacs from '~icons/logos/emacs'
import IconTerminal from '~icons/mdi/terminal'
import { gql } from '@urql/core'
import type { ExternalEditorSettingsFragment } from '../../generated/graphql'
import type { EditorId } from '@packages/types/src/editors'
import { useMutation } from '@urql/vue'
import { SetPreferredEditorDocument } from '@packages/data-context/src/gen/all-operations.gen'

interface EditorItem {
  name: string
  key: string
  binary: string | null
  icon: FunctionalComponent<SVGAttributes, {}>
}

// @ts-ignore (lachlan): add all icons for all editors
const icons: Record<EditorId, EditorItem['icon']> = {
  'code': VSCode,
  'webstorm': Webstorm,
  'atom': Atom,
  'sublimetext': Sublime,
  'sublimetext2': Sublime,
  'sublimetextdev': Sublime,
  'vim': Vim,
  'emacs': Emacs,
}

const externalEditors = computed(() => {
  return props.gql.editors.map((x) => ({ ...x, icon: icons[x.id] }))
})

gql`
mutation SetPreferredEditor ($binary: String!) {
  setPreferredEditor (binary: $binary)
}`

gql`
fragment ExternalEditorSettings on Query {
  editors {
    id
    name
    binary
    isPreferred
  }
}`

const setPreferredEditor = useMutation(SetPreferredEditorDocument)

const props = defineProps<{
  gql: ExternalEditorSettingsFragment
}>()

type ExternalEditor = ExternalEditorSettingsFragment['editors'][number]

const { t } = useI18n()
const selectedEditor = ref<ExternalEditor | undefined>(undefined)

const updateEditor = async (editor: ExternalEditor) => {
  if (!editor?.binary) {
    return
  }

  await setPreferredEditor.executeMutation({ binary: editor.binary })
  selectedEditor.value = editor
}

watchEffect(() => {
  const preferred = props.gql.editors.find((x) => x.isPreferred)

  selectedEditor.value = preferred
})
</script>
