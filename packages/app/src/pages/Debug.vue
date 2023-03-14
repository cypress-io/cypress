<template>
  <DebugContainer
    data-cy="debug-container"
    :gql="cachedProject"
    :is-loading="isLoading"
    :commits-ahead="relevantRuns?.commitsAhead || 0"
    :online="online"
  />
</template>

<script setup lang="ts">

import DebugContainer from '../debug/DebugContainer.vue'
import { gql, useQuery, useSubscription } from '@urql/vue'
import { useOnline } from '@vueuse/core'

import { DebugDocument, DebugSpecsFragment, Debug_SpecsChangeDocument } from '../generated/graphql'
import { computed, ref, watchEffect, onBeforeUnmount, onMounted } from 'vue'
import { useRelevantRun } from '../composables/useRelevantRun'
import { useDebugStore } from '../store/debug-store'

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
query Debug($commitShas: [String!]!) {
  ...DebugSpecs
}
`

const relevantRuns = useRelevantRun('DEBUG')

const debugStore = useDebugStore()

onMounted(() => {
  debugStore.lockSelectedRunNumber()
})

onBeforeUnmount(() => {
  debugStore.unlockSelectedRunNumber()
})

const variables = computed(() => {
  // slice to remove `readonly` type
  const commitShas = (relevantRuns.value?.all ?? []).slice()

  if (debugStore.selectedRunNumber) {
    commitShas.push(debugStore.selectedRunNumber)
  }

  return {
    commitShas: [...new Set(commitShas)],
  }
})

const shouldPauseQuery = computed(() => {
  return !online
})

const cachedProject = ref<DebugSpecsFragment>()

const query = useQuery({ query: DebugDocument, variables, pause: shouldPauseQuery, requestPolicy: 'network-only' })

const isLoading = computed(() => {
  const relevantRunsHaveNotLoaded = !relevantRuns.value
  const queryIsBeingFetched = query.fetching.value

  const cloudProject = query.data.value?.currentProject?.cloudProject?.__typename === 'CloudProject'
    ? query.data.value?.currentProject?.cloudProject
    : null

  const waitingForRunToFetchFromTheCloud =
     !cloudProject?.runsByCommitShas
     || (cloudProject.runsByCommitShas && !debugStore.selectedRunNumber)

  return relevantRunsHaveNotLoaded || queryIsBeingFetched || waitingForRunToFetchFromTheCloud
})

watchEffect(() => {
  if (query.data.value?.currentProject?.cloudProject?.__typename === 'CloudProject') {
    const cloudProject = query.data.value.currentProject.cloudProject

    if (cloudProject.runsByCommitShas !== undefined) {
      cachedProject.value = query.data.value
    }
  }
})

useSubscription({ query: Debug_SpecsChangeDocument })

</script>
