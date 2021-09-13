<template>
  <WizardLayout :canNavigateForward="canNavigateForward">
    Loading...
  </WizardLayout>
</template>

<script lang="ts" setup>
import { onMounted, computed } from 'vue';
import WizardLayout from "./WizardLayout.vue";
import { useMutation, gql } from "@urql/vue";
import { InitializeConfigFragment, InitializeOpenProjectDocument } from "../generated/graphql"

gql`
fragment InitializeConfig on Query {
  wizard {
    canNavigateForward
  }
}
`

gql`
mutation InitializeOpenProject {
  initializeOpenProject {
    step
    canNavigateForward
  }
}
`

const props = defineProps<{
  gql: InitializeConfigFragment
}>()

const initializeOpenProject = useMutation(InitializeOpenProjectDocument)

const canNavigateForward = computed(() => props.gql.wizard.canNavigateForward ?? false)

onMounted(async () => {
  await initializeOpenProject.executeMutation({})
})

</script>