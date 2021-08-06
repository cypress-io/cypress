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
import Icon from '../../components/icon/Icon.vue'
import SettingsSection from '../SettingsSection.vue'
import { useI18n } from '../../composables';
import Select from '../../components/input/Select.vue';
import VSCode from 'virtual:vite-icons/logos/visual-studio-code'
import Atom from 'virtual:vite-icons/logos/atom-icon'
import Webstorm from 'virtual:vite-icons/logos/webstorm'
import Vim from 'virtual:vite-icons/logos/vim'
import Sublime from 'virtual:vite-icons/logos/sublimetext-icon'
import Emacs from 'virtual:vite-icons/logos/emacs'
import IconTerminal from 'virtual:vite-icons/mdi/terminal'

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
