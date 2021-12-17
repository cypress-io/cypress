<template>
  <TestingTypePicker
    :gql="props.gql"
    @pick="selectTestingType"
  />
</template>

<script setup lang="ts">
import { gql } from '@urql/core'
import { useMutation } from '@urql/vue'
import TestingTypePicker from '@cy/gql-components/TestingTypePicker.vue'
import {
  TestingTypeSelectionDocument,
  TestingTypeCardsFragment,
} from '../generated/graphql'

gql`
fragment TestingTypeCards on Query {
  ...TestingTypePicker
}
`

gql`
mutation TestingTypeSelection($testingType: TestingTypeEnum!) {
  setCurrentTestingType(testingType: $testingType) {
    currentTestingType
    currentProject {
      id
      currentTestingType
      isCTConfigured
      isE2EConfigured
      isLoadingConfigFile
      isLoadingNodeEvents
    }
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
