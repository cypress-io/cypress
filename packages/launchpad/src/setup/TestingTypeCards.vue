<template>
  <div class="max-w-4xl mx-5 mx-auto text-center">
    <TestingTypeCard
      :id="ct.id"
      :title="ct.title"
      :description="firstTimeCT ? ct.description : 'LAUNCH'"
      :role="firstTimeCT ? 'setup-component-testing' : 'launch-component-testing'"
      @click="ctNextStep" 
      v-if="ct"
    />

    <TestingTypeCard
      :id="e2e.id"
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
      title
      description
    }
  }
}
`

gql`
mutation TestingTypeSelect($testingType: TestingTypeEnum!) {
  wizardSetTestingType(type: $testingType) {
    step
    testingType
    title
    description
  }
}
`

gql`
mutation TestingTypeCardsNavigateForward {
  wizardNavigate(direction: forward) {
    step
  }
}
`

const mutation = useMutation(TestingTypeSelectDocument)
const navigateForwardMutation = useMutation(TestingTypeCardsNavigateForwardDocument)

const props = defineProps<{
  gql: TestingTypeCardsFragment
}>()

const ct = computed(() => {
  return props.gql.wizard.testingTypes.find(x => x.id === 'component')
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
  return props.gql.wizard.testingTypes.find(x => x.id === 'e2e')
})
</script>
