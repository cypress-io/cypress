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
fragment TestingTypeCards on App {
  ...TestingTypePicker
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

function selectTestingType (testingType: 'e2e' | 'component') {
  mutation.executeMutation({ input: { testingType, direction: 'forward' } })
}

</script>
