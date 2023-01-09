<template>
  <DebugContainer
    data-cy="debug-container"
    :gql="query.data.value"
    :is-loading="isLoading"
    :commits-ahead="relevantRuns?.commitsAhead"
  />
</template>

<script setup lang="ts">

import DebugContainer from '../debug/DebugContainer.vue'
import { gql, useQuery, useSubscription } from '@urql/vue'
import { DebugDocument, Debug_SpecsChangeDocument } from '../generated/graphql'
import { computed } from 'vue'
import { useRelevantRun } from '../composables/useRelevantRun'

gql`
subscription Debug_specsChange {
  specsChange {
    id
    specs {
      id
      ...DebugLocalSpecs
    }
  }
}
`

gql `
query Debug($runNumber: Int!, $nextRunNumber: Int!, $hasNextRun: Boolean!) {
  ...DebugSpecs
}
`

const relevantRuns = useRelevantRun()

const variables = computed(() => {
  return {
    runNumber: relevantRuns.value?.current || -1,
    nextRunNumber: relevantRuns.value?.next || -1,
    hasNextRun: !!relevantRuns.value?.next,
  }
})

const shouldPauseQuery = computed(() => {
  return variables.value.runNumber === -1
})

const query = useQuery({ query: DebugDocument, variables, pause: shouldPauseQuery, requestPolicy: 'network-only' })

const isLoading = computed(() => {
  return !relevantRuns.value || query.fetching.value
})

useSubscription({ query: Debug_SpecsChangeDocument })

</script>
