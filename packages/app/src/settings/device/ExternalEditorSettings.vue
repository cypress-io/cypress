<template>
  <SettingsSection>
    <template #title>
      {{ t('settingsPage.editor.title') }}
    </template>
    <template #description>
      {{ t('settingsPage.editor.description') }}
    </template>

    <div class="flex items-center">
      <input
        v-model="editorToUse"
        type="radio"
        class="mr-5px"
        data-cy="use-well-known-editor"
        value="found"
      >

      <Select
        :model-value="selectedWellKnownEditor"
        :options="externalEditors"
        item-value="name"
        item-key="id"
        :placeholder="t('settingsPage.editor.noEditorSelectedPlaceholder')"
        class="w-400px"
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
    </div>

    <div class="flex items-center py-2">
      <input
        v-model="editorToUse"
        type="radio"
        class="mr-5px"
        value="custom"
        data-cy="use-custom-editor"
      >

      <div class="w-400px">
        <Input
          v-model="customBinary"
          input-classes="text-sm"
          placeholder="Custom path..."
          @blur="setCustomBinary"
        >
          <template #prefix>
            <Icon
              :icon="IconTerminal"
              class="text-gray-600 text-md"
            />
          </template>
        </Input>
      </div>
    </div>
  </SettingsSection>
</template>

<script lang="ts" setup>
import { ref, computed, watch, FunctionalComponent, SVGAttributes } from 'vue'
import Icon from '@cy/components/Icon.vue'
import SettingsSection from '../SettingsSection.vue'
import { useI18n } from '@cy/i18n'
import Select from '@cy/components/Select.vue'
import Input from '@cy/components/Input.vue'
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

type Editor = ExternalEditorSettingsFragment['localSettings']['availableEditors'][number]

const customBinary = ref<string>('')
const selectedWellKnownEditor = ref<Editor>()
const editorToUse = ref<'found' | 'custom'>('found')

watch(
  () => props.gql.localSettings.preferences.preferredEditorBinary,
  (perferredEditorBinary) => {
    const isWellKnownEditor = props.gql.localSettings.availableEditors.find((x) => {
      return x.binary === perferredEditorBinary
    })

    editorToUse.value = isWellKnownEditor ? 'found' : 'custom'

    if (isWellKnownEditor) {
      selectedWellKnownEditor.value = isWellKnownEditor
    }

    if (editorToUse.value === 'custom' && perferredEditorBinary) {
      customBinary.value = perferredEditorBinary
    }
  }, { immediate: true },
)

watch(editorToUse, (val) => {
  if (val === 'custom') {
    setPreferredEditor.executeMutation({ value: customBinary.value })
  }
})

const setCustomBinary = () => {
  if (editorToUse.value === 'custom') {
    setPreferredEditor.executeMutation({ value: customBinary.value })
  }
}

const updateEditor = (editor: Editor) => {
  if (editorToUse.value !== 'found') {
    editorToUse.value = 'found'
  }

  setPreferredEditor.executeMutation({ value: editor.binary })
}
</script>
