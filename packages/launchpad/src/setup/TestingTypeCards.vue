<template>
  <div class="max-w-4xl mx-auto text-center">
    <TestingTypeCard
      v-if="ct.isSetup"
      :id="ct.id"
      :title="ct.title"
      description="LAUNCH"
      role="launch-component-testing"
      @click="ctNextStep"
    />

    <TestingTypeCard
      v-else
      :id="ct.id"
      :title="ct.title"
      :description="ct.description"
      role="setup-component-testing"
      @click="ctNextStep"
    />

    <TestingTypeCard
      v-if="e2e.isSetup"
      :id="e2e.id"
      :title="e2e.title"
      description="LAUNCH"
      role="launch-e2e-testing"
      @click="e2eNextStep"
    />

    <TestingTypeCard
      v-else
      :id="e2e.id"
      :title="e2e.title"
      :description="e2e.description"
      role="setup-e2e-testing"
      @click="e2eNextStep"
    />
  </div>
</template>

<script setup lang="ts">
import { gql } from "@urql/core";
import { useMutation } from "@urql/vue";
import { computed } from "vue";
import { 
  TestingTypeEnum,
  TestingTypeCardsWizardFragment,
  TestingTypeCardsAppFragment,
  TestingTypeSelectDocument,
  TestingTypeCardsNavigateForwardDocument
} from "../generated/graphql";
import TestingTypeCard from "./TestingTypeCard.vue";

gql`
fragment TestingTypeCardsApp on App {
  activeProject {
    hasSetupComponentTesting
    hasSetupE2ETesting
  }
}
`
  
gql`
fragment TestingTypeCardsWizard on Wizard {
  testingTypes {
    id
    title
    description
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
  gql: {
    app: TestingTypeCardsAppFragment
    wizard: TestingTypeCardsWizardFragment
  }
}>()

const ct = computed(() => {
  return {
    ...props.gql.wizard.testingTypes.find(x => x.id === 'component')!,
    isSetup: props.gql?.app?.activeProject?.hasSetupComponentTesting ?? false
  }
})

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
  return {
    ...props.gql.wizard.testingTypes.find(x => x.id === 'e2e')!,
    isSetup: props.gql?.app?.activeProject?.hasSetupE2ETesting ?? false
  }
})
</script>
