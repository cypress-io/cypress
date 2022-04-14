<template>
  <TestingTypePicker
    :gql="props.gql"
    :is-app="false"
    @pick="selectTestingType"
  />
</template>

<script setup lang="ts">
import { gql } from '@urql/core'
import { useMutation } from '@urql/vue'
import TestingTypePicker from '@cy/gql-components/TestingTypePicker.vue'
import type { TestingTypeCardsFragment } from '../generated/graphql'
import { TestingTypeSelectionDocument } from '../generated/graphql'

gql`
fragment TestingTypeCards on Query {
  ...TestingTypePicker
}
`

gql`
mutation TestingTypeSelection($testingType: TestingTypeEnum!) {
  setAndLoadCurrentTestingType(testingType: $testingType) {
    currentProject {
      id
      currentTestingType
      isCTConfigured
      isE2EConfigured
      isLoadingConfigFile
      isLoadingNodeEvents
    }
    ...Wizard
  }
}
`

const mutation = useMutation(TestingTypeSelectionDocument)

const props = defineProps<{
  gql: TestingTypeCardsFragment
}>()

function selectTestingType (testingType: 'e2e' | 'component') {
  mutation.executeMutation({ testingType })
}

</script>
