<template>
  <SettingsSection>
    <template #title>
      {{ t('settingsPage.editor.title') }}
    </template>
    <template #description>
      {{ t('settingsPage.editor.description') }}
    </template>
    <Select
      v-model="selectedEditor"
      :options="externalEditors"
      item-value="name"
      :placeholder="t('settingsPage.editor.noEditorSelectedPlaceholder')"
      class="w-300px"
    >
      <template #input-prefix="{ value }">
        <Icon
          v-if="value"
          :icon="value.icon"
          class="text-md"
        />
        <Icon
          v-else
          :icon="IconTerminal"
          class="text-gray-600 text-md"
        />
      </template>
      <template #item-prefix="{value}">
        <Icon
          :icon="value.icon"
          class="text-md"
        />
      </template>
    </Select>
  </SettingsSection>
</template>

<script lang="ts" setup>
import { computed, FunctionalComponent, ref, SVGAttributes } from 'vue'
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

interface EditorItem {
  name: string
  key: string
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

// TODO, grab these from gql or the user's machine.
const externalEditors = computed((): EditorItem[] => 
  props.gql.editors.map(editor => ({
    key: editor.id,
    name: editor.name,
    icon: icons[editor.id]
  }))
)

gql`
fragment ExternalEditorSettings on Query {
  editors {
    id
    name
    openerId
  }
}`


const props = defineProps<{
  gql: ExternalEditorSettingsFragment
}>()

const { t } = useI18n()
const selectedEditor = ref<Record<string, any>>()
</script>
