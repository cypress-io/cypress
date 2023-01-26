<template>
  <DebugContainer
    data-cy="debug-container"
    :gql="query.data.value"
    :is-loading="isLoading"
    :commits-ahead="relevantRuns?.commitsAhead || 0"
    :online="online"
  />
</template>

<script setup lang="ts">

import DebugContainer from '../debug/DebugContainer.vue'
import { gql, useQuery, useSubscription } from '@urql/vue'
import { useOnline } from '@vueuse/core'

import { DebugDocument, Debug_SpecsChangeDocument } from '../generated/graphql'
import { computed } from 'vue'
import { useRelevantRun } from '../composables/useRelevantRun'

const online = useOnline()

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

const relevantRuns = useRelevantRun('DEBUG')

const variables = computed(() => {
  return {
    runNumber: relevantRuns.value?.current || -1,
    nextRunNumber: relevantRuns.value?.next || -1,
    hasNextRun: !!relevantRuns.value?.next,
  }
})

const shouldPauseQuery = computed(() => {
  return variables.value.runNumber === -1 || !online
})

const query = useQuery({ query: DebugDocument, variables, pause: shouldPauseQuery, requestPolicy: 'network-only' })

const isLoading = computed(() => {
  const relevantRunsHaveNotLoaded = !relevantRuns.value
  const queryIsBeingFetched = query.fetching.value
  const waitingForRunToFetchFromTheCloud = relevantRuns.value?.current !== -1
    && (!query.data.value?.currentProject?.cloudProject
      || query.data.value?.currentProject?.cloudProject?.__typename === 'CloudProject'
      && !query.data.value.currentProject.cloudProject.runByNumber?.status)

  return relevantRunsHaveNotLoaded || queryIsBeingFetched || waitingForRunToFetchFromTheCloud
})

useSubscription({ query: Debug_SpecsChangeDocument })

</script>
