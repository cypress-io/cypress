<template>
  <SettingsSection>
    <template #title>{{ t('settingsPage.editor.title') }}</template>
    <template #description>{{ t('settingsPage.editor.description') }}</template>
    <Select :options="externalEditors"
      v-model="selectedEditor"
      item-value="name"
      :placeholder="t('settingsPage.editor.noEditorSelectedPlaceholder')"
      class="w-300px">
      <template #input-prefix="{ value }">
        <Icon v-if="value" :icon="value.icon" class="text-md"></Icon>
        <Icon v-else :icon="IconTerminal" class="text-gray-600 text-md"></Icon>
      </template>
      <template #item-prefix="{value}">
        <Icon :icon="value.icon" class="text-md"></Icon>
    </template>
    </Select>
  </SettingsSection>
</template>

<script lang="ts" setup>

import { ref } from 'vue'
import Icon from '@cy/components/Icon.vue'
import SettingsSection from '../SettingsSection.vue'
import { useI18n } from '@cy/i18n';
import Select from '@cy/components/Select.vue';
import VSCode from '~icons/logos/visual-studio-code'
import Atom from '~icons/logos/atom-icon'
import Webstorm from '~icons/logos/webstorm'
import Vim from '~icons/logos/vim'
import Sublime from '~icons/logos/sublimetext-icon'
import Emacs from '~icons/logos/emacs'
import IconTerminal from '~icons/mdi/terminal'

// TODO, grab these from gql or the user's machine.
const externalEditors = [
  {
    name: 'Visual Studio Code',
    key: 'vscode',
    icon: VSCode
  },
  {
    name: "Webstorm",
    key: "webstorm",
    icon: Webstorm
  },
  {
    name: 'Atom',
    key: 'atom',
    icon: Atom
  },
  {
    name: 'Sublime Text',
    key: 'sublime',
    icon: Sublime
  },
  {
    name: 'Vim',
    key: 'vim',
    icon: Vim
  },
  {
    name: 'Emacs',
    key: 'emacs',
    icon: Emacs
  },
]

const { t } = useI18n()
const selectedEditor = ref()
</script>
