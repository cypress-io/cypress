<template>
  <div class="flex items-center">
    <input
      id="editorToUse"
      v-model="editorToUse"
      type="radio"
      class="mr-5px"
      data-cy="use-well-known-editor"
      value="found"
      @change="saveEditor"
    >
    <label
      for="editorToUse"
      class="sr-only"
    >{{ t('settingsPage.editor.editorRadioLabel') }}
    </label>
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
        <i-cy-terminal_x16
          v-else
          class="text-md text-gray-600"
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

  <div class="flex py-2 items-center">
    <input
      id="customEditor"
      v-model="editorToUse"
      type="radio"
      class="mr-5px"
      value="custom"
      data-cy="use-custom-editor"
      @change="saveEditor"
    >
    <label
      for="customEditor"
      class="sr-only"
    >{{ t('settingsPage.editor.customEditorRadioLabel') }}
    </label>

    <div class="w-400px">
      <Input
        id="customPath"
        v-model="customBinary"
        data-cy="custom-editor"
        input-classes="text-sm"
        :placeholder="t('settingsPage.editor.customPathPlaceholder')"
      >
        <template #prefix>
          <i-cy-terminal_x16 class="text-md text-gray-600" />
        </template>
      </Input>
      <label
        for="customPath"
        class="sr-only"
      >{{ t('settingsPage.editor.customPathPlaceholder') }}</label>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, FunctionalComponent, SVGAttributes } from 'vue'
import Icon from '@cy/components/Icon.vue'
import { useI18n } from '@cy/i18n'
import Select from '@cy/components/Select.vue'
import Input from '@cy/components/Input.vue'
import VSCode from '~icons/logos/visual-studio-code'
import Atom from '~icons/logos/atom-icon'
import Webstorm from '~icons/logos/webstorm'
import Vim from '~icons/logos/vim'
import Sublime from '~icons/logos/sublimetext-icon'
import Computer from '~icons/mdi/computer'
import Emacs from '~icons/logos/emacs'
import { gql } from '@urql/core'
import type { ChooseExternalEditorFragment } from '../generated/graphql'

const icons: Record<string, FunctionalComponent<SVGAttributes, {}>> = {
  'code': VSCode,
  'webstorm': Webstorm,
  'atom': Atom,
  'sublimetext': Sublime,
  'sublimetext2': Sublime,
  'sublimetextdev': Sublime,
  'vim': Vim,
  'emacs': Emacs,
  'finder': Computer,
  'computer': Computer,
  'File Explorer': Computer,
  'File System': Computer,
}

const externalEditors = computed(() => {
  return props.gql.localSettings.availableEditors?.map((x) => ({ ...x, icon: icons[x.id] })) || []
})

gql`
fragment ChooseExternalEditor on Query {
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

const props = defineProps<{
  gql: ChooseExternalEditorFragment
}>()

const { t } = useI18n()

type Editor = ChooseExternalEditorFragment['localSettings']['availableEditors'][number]

type EditorType = 'found' | 'custom'

const selectedWellKnownEditor = ref<Editor | undefined>(
  props.gql.localSettings.availableEditors.find((editor) => {
    return editor.binary === props.gql.localSettings.preferences.preferredEditorBinary
  }),
)

const customBinary = ref<string>(
  selectedWellKnownEditor.value
    ? ''
    : props.gql.localSettings.preferences.preferredEditorBinary ?? '',
)

const editorToUse = ref<EditorType>(customBinary.value ? 'custom' : 'found')

const emit = defineEmits<{
  (e: 'choseEditor', binary: string): void
}>()

const saveEditor = () => {
  if (editorToUse.value === 'found' && selectedWellKnownEditor.value) {
    emit('choseEditor', selectedWellKnownEditor.value.binary)
  }

  if (editorToUse.value === 'custom' && customBinary.value) {
    emit('choseEditor', customBinary.value)
  }
}

watch(customBinary, (val) => {
  if (editorToUse.value !== 'custom') {
    editorToUse.value = 'custom'
  }

  emit('choseEditor', val)
})

const updateEditor = (editor: Editor) => {
  if (editorToUse.value !== 'found') {
    editorToUse.value = 'found'
  }

  selectedWellKnownEditor.value = editor
  emit('choseEditor', selectedWellKnownEditor.value.binary)
}
</script>
