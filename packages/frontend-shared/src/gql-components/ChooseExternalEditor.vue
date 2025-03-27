<template>
  <div class="flex items-center">
    <!-- @vue-expect-error -->
    <Select
      :model-value="selectedEditor"
      :options="editorOptions"
      item-value="name"
      item-key="id"
      :label-id="labelId"
      :placeholder="t('settingsPage.editor.noEditorSelectedPlaceholder')"
      class="w-[400px]"
      @update:model-value="updateEditor"
    >
      <template #input-prefix="{ value }">
        <Icon
          v-if="value"
          :icon="icons[value.id]"
          class="text-md text-gray-500"
          icon-class="icon-dark-gray-500"
        />
        <i-cy-terminal_x16
          v-else
          class="text-md icon-dark-gray-500"
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

  <div
    v-if="editorToUse === 'custom'"
    class="flex py-[16px] pb-[4px] items-center"
  >
    <div class="w-[400px]">
      <Input
        id="customPath"
        v-model="customBinary"
        data-cy="custom-editor"
        input-classes="text-sm text-gray-500"
        :placeholder="t('settingsPage.editor.customPathPlaceholder')"
      >
        <template #prefix>
          <i-cy-technology-command-line_x16
            class="text-md icon-dark-gray-500"
          />
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
import type { FunctionalComponent, SVGAttributes } from 'vue'
import { ref, computed, watch } from 'vue'
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
import Terminal from '~icons/cy/terminal_x16.svg'
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
  'custom': Terminal,
}

const customEditor = { id: 'custom', icon: Terminal, name: 'Custom', binary: 'custom' }

const editorOptions = computed(() => {
  const editors = props.gql.localSettings.availableEditors?.map((x) => ({ ...x, icon: icons[x.id] })) || []

  editors.push(customEditor)

  return editors
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
  labelId: string
}>()

const { t } = useI18n()

type Editor = ChooseExternalEditorFragment['localSettings']['availableEditors'][number]

type EditorType = 'found' | 'custom'

const selectedWellKnownEditor: Editor | undefined = props.gql.localSettings.availableEditors.find((editor) => {
  return editor.binary && editor.binary === props.gql.localSettings.preferences.preferredEditorBinary
})

const customBinary = ref<string>(
  selectedWellKnownEditor
    ? ''
    : props.gql.localSettings.preferences.preferredEditorBinary ?? '',
)

const editorToUse = ref<EditorType>(
  customBinary.value ? 'custom' : 'found',
)

const selectedEditor = ref<Editor | undefined>(
  editorToUse.value === 'custom' ? customEditor : selectedWellKnownEditor,
)

const emit = defineEmits<{
  (e: 'choseEditor', binary: string | null): void
}>()

watch(customBinary, (val) => {
  if (editorToUse.value !== 'custom') {
    editorToUse.value = 'custom'
  }

  emit('choseEditor', val)
})

const updateEditor = (editor: Editor) => {
  selectedEditor.value = editor

  if (editor.id === 'custom') {
    editorToUse.value = 'custom'
    if (customBinary.value) {
      emit('choseEditor', customBinary.value)
    }
  } else {
    editorToUse.value = 'found'
    emit('choseEditor', selectedEditor.value.binary)
  }
}
</script>
