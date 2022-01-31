<template>
  <template v-if="query?.data?.value">
    <button
      data-cy="open-config-file"
      class="hocus-link-default underline-purple-500"
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
      v-if="isChooseEditorOpen"
      :open="isChooseEditorOpen"
      :gql="query.data?.value"
      @close="isChooseEditorOpen = false"
      @selected="openFile"
    />
  </template>
  <div v-else />
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { gql, useMutation, useQuery } from '@urql/vue'
import { OpenConfigFileDocument } from '@packages/data-context/src/gen/all-operations.gen'
import { OpenConfigFileInIdeDocument } from '../generated/graphql'
import ChooseExternalEditorModal from './ChooseExternalEditorModal.vue'

gql`
query OpenConfigFileInIDE {
  currentProject {
    id
    configFile
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

const query = useQuery({ query: OpenConfigFileInIdeDocument, requestPolicy: 'network-only' })

const configFile = computed(() => query.data?.value?.currentProject?.configFile ?? 'cypress.config.js')

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

  if (query.data?.value?.currentProject?.configFileAbsolutePath) {
    openConfigFileInIDE(query.data?.value?.currentProject.configFileAbsolutePath)
  }
}

const showCypressConfigInIDE = () => {
  if (query.data?.value?.localSettings.preferences.preferredEditorBinary && query.data?.value?.currentProject?.configFileAbsolutePath) {
    openConfigFileInIDE(query.data?.value?.currentProject.configFileAbsolutePath)
  } else {
    isChooseEditorOpen.value = true
  }
}

const isChooseEditorOpen = ref(false)

</script>
