<template>
  <div
    class="border rounded cursor-pointer flex flex-row bg-gray-50 border-red-100 mt-16px text-indigo-500 text-14px leading-24px items-center"
    tab-index="1"
    @click="openFile"
  >
    <i-cy-document-text_x16 class="h-16px m-12px mr-8px w-16px icon-dark-indigo-500 icon-light-indigo-100" />
    <code>{{ fileText }}</code>
    <ChooseExternalEditorModal
      :open="chooseExternalEditor"
      :gql="props.gql"
      @close="chooseExternalEditor = false"
      @selected="openFile"
    />
  </div>
</template>

<script lang="ts" setup>
import { gql, useMutation } from '@urql/vue'
import { computed, ref } from 'vue'
import ChooseExternalEditorModal from '@cy/gql-components/ChooseExternalEditorModal.vue'
import { ErrorCodeFrameFragment, ErrorCodeFrame_OpenFileInIdeDocument } from '../generated/graphql'

gql`
fragment ErrorCodeFrame_FileParts on FileParts {
  id
  absolute
  relative
  line
  column
}`

gql`
fragment ErrorCodeFrame on Query {
  localSettings {
    preferences {
      preferredEditorBinary
    }
  }
  ...ChooseExternalEditorModal
  baseError{
    fileToOpen {
      id
      ...ErrorCodeFrame_FileParts
    }
  }
}`

gql`
mutation ErrorCodeFrame_OpenFileInIde ($input: FileDetailsInput!) {
  openFileInIDE (input: $input)
}
`

const props = defineProps<{
 gql: ErrorCodeFrameFragment,
}>()

const fileText = computed(() => {
  const { relative, line, column } = props.gql.baseError?.fileToOpen ?? {}

  return `${relative}${(line && column) ? `:${line}:${column}` : ''}`
})

const chooseExternalEditor = ref(false)

const openFileInIDE = useMutation(ErrorCodeFrame_OpenFileInIdeDocument)

function openFile () {
  if (props.gql.localSettings.preferences.preferredEditorBinary) {
    chooseExternalEditor.value = false
    openFileInIDE.executeMutation({
      input: {
        absolute: props.file.absolute,
        column: props.file.column,
        line: props.file.line,
      },
    })
  } else {
    chooseExternalEditor.value = true
  }
}
</script>
