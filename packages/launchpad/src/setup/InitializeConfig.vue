<template>
  <WizardLayout
    :can-navigate-forward="canNavigateForward"
    class="max-w-640px"
  >
    <div class="flex flex-col items-center mx-auto my-10">
      <img
        src="../images/success.svg"
        class="my-2"
      >
      <span class="my-2">
        {{ props.gql.wizard.chosenTestingTypePluginsInitialized ? 'Project initialized.' : 'Initializing...' }}
      </span>
    </div>
  </WizardLayout>
</template>

<script lang="ts" setup>
import { onMounted, computed } from 'vue'
import WizardLayout from './WizardLayout.vue'
import { useMutation, gql } from '@urql/vue'
import { InitializeConfig_ConfigFragment, InitializeOpenProjectDocument } from '../generated/graphql'

gql`
fragment InitializeConfig_WizardState on Wizard {
  canNavigateForward
  chosenTestingTypePluginsInitialized
  step
}
`

gql`
fragment InitializeConfig_Config on Query {
  wizard {
    ...InitializeConfig_WizardState
  }

  currentProject {
    id
    currentBrowser {
      id
      displayName
    }
    browsers {
      id
      name
      family
      disabled
      isSelected
      channel
      displayName
      path
      version
      majorVersion
    }
  }
}
`

gql`
mutation InitializeOpenProject {
  initializeOpenProject 
}
`

const props = defineProps<{
  gql: InitializeConfig_ConfigFragment
}>()

const initializeOpenProject = useMutation(InitializeOpenProjectDocument)

const canNavigateForward = computed(() => props.gql.wizard.canNavigateForward ?? false)

onMounted(async () => {
  await initializeOpenProject.executeMutation({})
})

</script>
