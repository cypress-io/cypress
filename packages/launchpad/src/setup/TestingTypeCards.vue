<template>
  <div class="max-w-4xl mx-auto text-center">
    <TestingTypeCard
      v-if="ct.isSetup"
      :id="ct.id"
      :title="ct.title"
      description="LAUNCH"
      role="launch-component-testing"
      @click="emit('launchCt')"
    />

    <TestingTypeCard
      v-else
      :id="ct.id"
      :title="ct.title"
      :description="ct.description"
      role="setup-component-testing"
      @click="selectTestingType('component')"
    />

    <TestingTypeCard
      v-if="e2e.isSetup"
      :id="e2e.id"
      :title="e2e.title"
      description="LAUNCH"
      role="launch-e2e-testing"
      @click="emit('launchE2E')"
    />

    <TestingTypeCard
      v-else
      :id="e2e.id"
      :title="e2e.title"
      :description="e2e.description"
      role="setup-e2e-testing"
      @click="selectTestingType('e2e')"
    />
  </div>
</template>

<script setup lang="ts">
import { gql } from "@urql/core";
import { useMutation } from "@urql/vue";
import { computed } from "vue";
import { 
  TestingTypeAppQueryFragment, 
  TestingTypeWizardQueryFragment, 
  TestingTypeEnum,
  TestingTypeSelectDocument 
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

const mutation = useMutation(TestingTypeSelectDocument)

const props = defineProps<{
  gql: {
    // app: TestingTypeAppFragment
    // wizard: TestingTypeWizardFragment
  }
}>()

const emit = defineEmits<{
  (event: 'launchCt'): void
  (event: 'launchE2E'): void
}>()

const ct = computed(() => {
  const type = props.gql?.wizard?.testingTypes?.find(x => x.id === 'component')
  if (!type) {
    throw Error('Did not get testingType from API')
  }

  return {
    ...type,
    isSetup: props.gql?.app?.activeProject?.hasSetupComponentTesting ?? false
  }
})

const selectTestingType = (testingType: TestingTypeEnum) => {
  mutation.executeMutation({ testingType });
};

const e2e = computed(() => {
  const type = props.gql?.wizard?.testingTypes?.find(x => x.id === 'e2e')
  if (!type) {
    throw Error('Did not get testingType from API')
  }

  return {
    ...type,
    isSetup: props.gql?.app?.activeProject?.hasSetupE2ETesting ?? false
  }
})
</script>
