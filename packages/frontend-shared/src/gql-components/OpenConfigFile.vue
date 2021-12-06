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
import { NoSpecsPage_OpenFileInIdeDocument } from '@packages/data-context/src/gen/all-operations.gen'
import type { OpenConfigFileFragment } from '../generated/graphql'

gql`
fragment OpenConfigFile on Query {
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
}
`

const props = defineProps<{
  gql: OpenConfigFileFragment
}>()

const configFile = computed(() => props.gql.currentProject?.configFilePath ?? 'cypress.config.js')

const openFileInIDE = useMutation(NoSpecsPage_OpenFileInIdeDocument)

const openInIde = (absolute: string) => {
  openFileInIDE.executeMutation({
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
    openInIde(props.gql.currentProject.configFileAbsolutePath)
  }
}

const showCypressConfigInIDE = () => {
  if (props.gql.localSettings.preferences.preferredEditorBinary && props.gql.currentProject?.configFileAbsolutePath) {
    openInIde(props.gql.currentProject.configFileAbsolutePath)
  } else {
    isChooseEditorOpen.value = true
  }
}

const isChooseEditorOpen = ref(false)

</script>
