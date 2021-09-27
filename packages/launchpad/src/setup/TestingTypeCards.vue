<template>
  <div class="flex justify-center mx-4 md:mx-auto mt-9 max-w-804px gap-24px">
    <TestingTypeCard
      :id="ct.type"
      :title="ct.title"
      :description="firstTimeCT ? ct.description : 'LAUNCH'"
      :role="firstTimeCT ? 'setup-component-testing' : 'launch-component-testing'"
      @click="ctNextStep" 
      v-if="ct"
    />

    <TestingTypeCard
      :id="e2e.type"
      :title="e2e.title"
      :description="firstTimeE2E ? e2e.description : 'LAUNCH'"
      :role="firstTimeE2E ? 'setup-e2e-testing' : 'launch-e2e-testing'"
      @click="e2eNextStep"
      v-if="e2e"
    />
  </div>
</template>

<script setup lang="ts">
import { gql } from "@urql/core";
import { useMutation } from "@urql/vue";
import { computed } from "vue";
import { 
  TestingTypeEnum,
  TestingTypeSelectDocument,
  TestingTypeCardsNavigateForwardDocument,
  TestingTypeCardsFragment
} from "../generated/graphql";
import TestingTypeCard from "./TestingTypeCard.vue";

gql`
fragment TestingTypeCards on Query {
  app {
    activeProject {
      id
      isFirstTimeCT
      isFirstTimeE2E
    }
  }

  wizard {
    testingTypes {
      id
      type
      title
      description
    }
  }

  ...ConfigFile
}
`

gql`
mutation TestingTypeSelect($testingType: TestingTypeEnum!) {
  wizardSetTestingType(type: $testingType) {
    testingType
  }
}
`

gql`
mutation TestingTypeCardsNavigateForward {
  wizardNavigate(direction: forward) {
    step
    chosenTestingTypePluginsInitialized
    canNavigateForward
    title
    description
  }
}
`

const mutation = useMutation(TestingTypeSelectDocument)
const navigateForwardMutation = useMutation(TestingTypeCardsNavigateForwardDocument)

const props = defineProps<{
  gql: TestingTypeCardsFragment
}>()

const ct = computed(() => {
  return props.gql.wizard.testingTypes.find(x => x.type === 'component')
})

const firstTimeCT = computed(() => props.gql.app.activeProject?.isFirstTimeCT)
const firstTimeE2E = computed(() => props.gql.app.activeProject?.isFirstTimeE2E)

const selectTestingType = (testingType: TestingTypeEnum) => {
  return mutation.executeMutation({ testingType })
}

const ctNextStep = async () => {
  await selectTestingType('component')
  navigateForwardMutation.executeMutation({})
}

const e2eNextStep = async () => {
  await selectTestingType('e2e')
  navigateForwardMutation.executeMutation({})
}

const e2e = computed(() => {
  return props.gql.wizard.testingTypes.find(x => x.type === 'e2e')
})
</script>
