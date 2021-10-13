<template>
  <WizardLayout :can-navigate-forward="canNavigateForward">
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
import { Config_InitializeConfigFragment, InitializeOpenProjectDocument } from '../generated/graphql'

gql`
fragment WizardState_InitializeConfig on Wizard {
  canNavigateForward
  chosenTestingTypePluginsInitialized
  step
}
`

gql`
fragment Config_InitializeConfig on Query {
  wizard {
    ...WizardState_InitializeConfig
  }

  app {
    selectedBrowser {
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
  initializeOpenProject {
    ...WizardState_InitializeConfig
  }
}
`

const props = defineProps<{
  gql: Config_InitializeConfigFragment
}>()

const initializeOpenProject = useMutation(InitializeOpenProjectDocument)

const canNavigateForward = computed(() => props.gql.wizard.canNavigateForward ?? false)

onMounted(async () => {
  await initializeOpenProject.executeMutation({})
})

</script>
