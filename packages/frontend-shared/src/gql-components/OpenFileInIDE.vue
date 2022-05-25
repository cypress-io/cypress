<template>
  <slot :on-click="maybeShowFileInIDE" />
  <ChooseExternalEditorModal
    v-if="isChooseEditorOpen && query.data.value"
    :open="isChooseEditorOpen"
    :gql="query.data.value"
    @close="isChooseEditorOpen = false"
    @selected="openFile"
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { gql, useMutation, useQuery } from '@urql/vue'
import { OpenFileInIdeDocument, OpenFileInIde_MutationDocument } from '../generated/graphql'
import ChooseExternalEditorModal from './ChooseExternalEditorModal.vue'

gql`
query OpenFileInIDE {
  localSettings {
    preferences {
      preferredEditorBinary
    }
  }
  ...ChooseExternalEditorModal
}
`

gql`
mutation OpenFileInIDE_Mutation ($input: FileDetailsInput!) {
  openFileInIDE (input: $input)
}
`

const props = defineProps<{
  line?: number
  column?: number
  filePath: string
}>()

const query = useQuery({ query: OpenFileInIdeDocument, requestPolicy: 'network-only' })

const OpenFileInIDE = useMutation(OpenFileInIde_MutationDocument)

const openFileInIDE = () => {
  OpenFileInIDE.executeMutation({
    input: {
      filePath: props.filePath,
      line: props.line ?? 1,
      column: props.column ?? 1,
    },
  })
}

const openFile = () => {
  isChooseEditorOpen.value = false

  openFileInIDE()
}

const maybeShowFileInIDE = () => {
  // If we haven't fetched the data yet checking for the local binary,
  // wait until we have it before possibly prompting
  if (query.fetching.value) {
    query.then(() => {
      maybeShowFileInIDE()
    })

    return
  }

  if (query.data?.value?.localSettings.preferences.preferredEditorBinary) {
    openFileInIDE()
  } else {
    isChooseEditorOpen.value = true
  }
}

const isChooseEditorOpen = ref(false)

</script>
