<template>
  <RecordPrompt
    :record-key="query.data.value?.currentProject?.cloudProject?.__typename === 'CloudProject' ? query.data.value?.currentProject.cloudProject.recordKeys?.[0]?.key : ''"
    :current-testing-type="query.data.value?.currentProject?.currentTestingType"
  />
</template>

<script setup lang="ts">
import { gql, useQuery } from '@urql/vue'
import { RecordPromptAdapterDocument } from '../generated/graphql'
import RecordPrompt from './RecordPrompt.vue'

gql`
query RecordPromptAdapter {
  currentProject {
    id
    title
    currentTestingType
    cloudProject {
      __typename
      ... on CloudProject {
        id
        recordKeys {
          id
          key
        }
      }
    }
  }
}
`

const query = useQuery({ query: RecordPromptAdapterDocument })

</script>
