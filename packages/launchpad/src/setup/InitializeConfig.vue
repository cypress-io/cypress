<template>
  <WizardLayout :canNavigateForward="canNavigateForward">
    <div class="flex flex-col items-center mx-auto my-10">
      <img src="../images/success.svg" class="my-2"/>
      <span class="my-2">
        {{ props.gql.chosenTestingTypePluginsInitialized ? 'Project initialized.' : 'Initializing...' }}
      </span>
    </div>
  </WizardLayout>
</template>

<script lang="ts" setup>
import { onMounted, computed } from 'vue';
import WizardLayout from "./WizardLayout.vue";
import { useMutation, gql } from "@urql/vue";
import { InitializeConfigFragment, InitializeOpenProjectDocument } from "../generated/graphql"

gql`
fragment InitializeConfig on Wizard {
  canNavigateForward
  chosenTestingTypePluginsInitialized
  step
}
`

gql`
mutation InitializeOpenProject {
  initializeOpenProject {
    ...InitializeConfig
  }
}
`

const props = defineProps<{
  gql: InitializeConfigFragment
}>()

const initializeOpenProject = useMutation(InitializeOpenProjectDocument)

const canNavigateForward = computed(() => props.gql.canNavigateForward ?? false)

onMounted(async () => {
  await initializeOpenProject.executeMutation({})
})

</script>