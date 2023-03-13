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
import { computed, ref, watchEffect } from 'vue'
import { useRelevantRun, useSelectedRunSha } from '../composables/useRelevantRun'

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

const { selectedRunSha } = useSelectedRunSha()

const variables = computed(() => {
  // slice to remove `readonly` type
  const commitShas = (relevantRuns.value?.all ?? []).slice()

  if (selectedRunSha.value) {
    commitShas.push(selectedRunSha.value)
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

    console.log(
  cloudProject, selectedRunSha.value
    )
  const waitingForRunToFetchFromTheCloud = 
     !cloudProject?.runsByCommitShas
     || (cloudProject.runsByCommitShas && !selectedRunSha.value)

     console.log(
  relevantRunsHaveNotLoaded  ,queryIsBeingFetched, waitingForRunToFetchFromTheCloud
     )
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
