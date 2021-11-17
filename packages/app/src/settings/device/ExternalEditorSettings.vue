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
          :icon="IconTerminal"
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
import { computed, FunctionalComponent, SVGAttributes } from 'vue'
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
import { SetPreferredEditorBinaryDocument, ExternalEditorSettingsFragment } from '../../generated/graphql'
import { useMutation } from '@urql/vue'

// @ts-ignore (lachlan): add all icons for all editors such as RubyMine, etc
const icons: Record<string, FunctionalComponent<SVGAttributes, {}>> = {
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
  return props.gql.localSettings.availableEditors?.map((x) => ({ ...x, icon: icons[x.id] })) || []
})

gql`
mutation SetPreferredEditorBinary ($value: String!) {
  setPreferredEditorBinary (value: $value)
}`

gql`
fragment ExternalEditorSettings on Query {
  localSettings {
    availableEditors {
      id
      name
      binary
    }

    preferences {
      preferredEditorBinary
    }
  }
}`

const setPreferredEditor = useMutation(SetPreferredEditorBinaryDocument)

const props = defineProps<{
  gql: ExternalEditorSettingsFragment
}>()

const { t } = useI18n()

const selectedEditor = computed(() => {
  return props.gql.localSettings.availableEditors.find((x) => x.binary === props.gql.localSettings.preferences.preferredEditorBinary)
})

const updateEditor = (editor: ExternalEditorSettingsFragment['localSettings']['availableEditors'][number]) => {
  setPreferredEditor.executeMutation({ value: editor.binary })
}
</script>
