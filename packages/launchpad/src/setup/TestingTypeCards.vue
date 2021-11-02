<template>
  <div class="flex justify-center mx-4 md:mx-auto mt-9 max-w-804px gap-24px">
    <TestingTypeCard
      v-if="e2e"
      :id="e2e.type"
      :data-cy-testingType="e2e.type"
      :title="e2e.title"
      :description="isE2EConfigured ? 'LAUNCH' : e2e.description "
      :configured="isE2EConfigured"
      :image="e2ePreview"
      role="button"
      @click="e2eNextStep"
      @keyup.self.enter="e2eNextStep"
      @keyup.self.space="e2eNextStep"
      @openCompare="$emit('openCompare')"
    />
    <TestingTypeCard
      v-if="ct"
      :id="ct.type"
      :data-cy-testingType="ct.type"
      :title="ct.title"
      :description="isCTConfigured ? 'LAUNCH' : ct.description"
      :configured="isCTConfigured"
      :image="ctPreview"
      role="button"
      @click="ctNextStep"
      @keyup.self.enter="ctNextStep"
      @keyup.self.space="ctNextStep"
      @openCompare="$emit('openCompare')"
    />
  </div>
</template>

<script setup lang="ts">
import { gql } from '@urql/core'
import { useMutation } from '@urql/vue'
import { computed } from 'vue'
import {
  TestingTypeSelectionDocument,
  TestingTypeCardsFragment,
} from '../generated/graphql'
import TestingTypeCard from './TestingTypeCard.vue'
import e2ePreview from '../images/e2e-preview.png'
import ctPreview from '../images/ct-preview.png'

gql`
fragment TestingTypeCards on Query {
  app {
    activeProject {
      id
      isCTConfigured
      isE2EConfigured
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
}
`

gql`
  mutation TestingTypeSelection($input: WizardUpdateInput!) {
  wizardUpdate(input: $input)
}
`

const mutation = useMutation(TestingTypeSelectionDocument)

const props = defineProps<{
  gql: TestingTypeCardsFragment
}>()

const ct = computed(() => {
  return props.gql.wizard.testingTypes.find((x) => x.type === 'component')
})

const isCTConfigured = computed(() => Boolean(props.gql.app.activeProject?.isCTConfigured))
const isE2EConfigured = computed(() => Boolean(props.gql.app.activeProject?.isE2EConfigured))

const ctNextStep = async () => {
  return mutation.executeMutation({ input: { testingType: 'component', direction: 'forward' } })
}

const e2eNextStep = async () => {
  return mutation.executeMutation({ input: { testingType: 'e2e', direction: 'forward' } })
}

const e2e = computed(() => {
  return props.gql.wizard.testingTypes.find((x) => x.type === 'e2e')
})

defineEmits<{
  (event: 'openCompare'): void
}>()

</script>
