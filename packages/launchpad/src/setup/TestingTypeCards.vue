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
  TestingTypeCards_SelectTestingTypeDocument,
  TestingTypeCardsFragment,
} from '../generated/graphql'

gql`
fragment TestingTypeCards on CurrentProject {
  id
  ...TestingTypePicker
}
`

gql`
mutation TestingTypeCards_selectTestingType($type: TestingTypeEnum!) {
  setCurrentTestingType(type: $type) {
    currentProject {
      id
      isLoadingConfig
      isLoadingPlugins
      config
      ...TestingTypeCards
    }
  }
}
`

const mutation = useMutation(TestingTypeCards_SelectTestingTypeDocument)

const props = defineProps<{
  gql: TestingTypeCardsFragment
}>()

function selectTestingType (testingType: 'e2e' | 'component') {
  mutation.executeMutation({ type: testingType })
}

</script>
