<template>
  <button
    @click="showCypressConfigInIDE()"
  >
    <slot>
      <span
        class="text-purple-500 cursor-pointer"
      >
        {{ configFile }}
      </span>
    </slot>
  </button>

  <ChooseExternalEditorModal
    :open="isChooseEditorOpen"
    :gql="props.gql"
    @close="isChooseEditorOpen = false"
    @selected="openFile"
  />
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { gql, useMutation } from '@urql/vue'
import { OpenConfigFileDocument } from '@packages/data-context/src/gen/all-operations.gen'
import type { OpenConfigFileInIdeFragment } from '../generated/graphql'
import ChooseExternalEditorModal from './ChooseExternalEditorModal.vue'

gql`
fragment OpenConfigFileInIDE on Query {
  currentProject {
    id
    configFilePath
    configFileAbsolutePath
  }
  localSettings {
    preferences {
      preferredEditorBinary
    }
  }
  ...ChooseExternalEditorModal
}
`

gql`
mutation OpenConfigFile ($input: FileDetailsInput!) {
  openFileInIDE (input: $input)
}
`

const props = defineProps<{
  gql: OpenConfigFileInIdeFragment
}>()

const configFile = computed(() => props.gql.currentProject?.configFilePath ?? 'cypress.config.js')

const OpenConfigFileInIDE = useMutation(OpenConfigFileDocument)

const openConfigFileInIDE = (absolute: string) => {
  OpenConfigFileInIDE.executeMutation({
    input: {
      absolute,
      line: 1,
      column: 1,
    },
  })
}

const openFile = () => {
  isChooseEditorOpen.value = false

  if (props.gql.currentProject?.configFileAbsolutePath) {
    openConfigFileInIDE(props.gql.currentProject.configFileAbsolutePath)
  }
}

const showCypressConfigInIDE = () => {
  if (props.gql.localSettings.preferences.preferredEditorBinary && props.gql.currentProject?.configFileAbsolutePath) {
    openConfigFileInIDE(props.gql.currentProject.configFileAbsolutePath)
  } else {
    isChooseEditorOpen.value = true
  }
}

const isChooseEditorOpen = ref(false)

</script>
