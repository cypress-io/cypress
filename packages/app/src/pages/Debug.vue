<template>
  <DebugContainer
    data-cy="debug-container"
    :gql="cachedProject"
    :is-loading="isLoading"
    :commits-ahead="relevantRuns.commitsAhead || 0"
    :current-commit-info="relevantRuns.currentCommitInfo"
    :online="online"
  />
</template>

<script setup lang="ts">

import DebugContainer from '../debug/DebugContainer.vue'
import { gql, useQuery } from '@urql/vue'
import { useOnline } from '@vueuse/core'

import { DebugDocument, DebugSpecsFragment, Debug_SpecsChangeDocument } from '../generated/graphql'
import { computed, ref, watchEffect } from 'vue'
import { useRelevantRun } from '../composables/useRelevantRun'
import { useRecordEvent } from '../composables/useRecordEvent'
import { useUserProjectStatusStore } from '@packages/frontend-shared/src/store/user-project-status-store'
import { useSubscription } from '../graphql'

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
query Debug($runNumber: Int!, $commitShas: [String!]!) {
  ...DebugSpecs
}
`

const props = defineProps<{
  from?: 'sidebar' | 'notification'
  runNumber?: string
}>()

const relevantRuns = useRelevantRun('DEBUG')

const recordEvent = useRecordEvent()

const userProjectStatusStore = useUserProjectStatusStore()

if (props.from) {
  recordEvent.record({
    campaign: 'Navigated To Debug Page',
    medium: props.from,
    includeMachineId: true,
    payload: {
      projectId: userProjectStatusStore.projectId,
      runNumber: props.runNumber,
      userUuid: recordEvent.decodeCloudId(userProjectStatusStore.userData?.id),
    },
  })
}

const variables = computed(() => {
  return {
    runNumber: relevantRuns.value.selectedRun?.runNumber || -1,
    commitShas: relevantRuns.value.commitShas,
  }
})

const shouldPauseQuery = computed(() => {
  return variables.value.runNumber === -1 || !online
})

const cachedProject = ref<DebugSpecsFragment>()

const query = useQuery({ query: DebugDocument, variables, pause: shouldPauseQuery, requestPolicy: 'network-only' })

const isLoading = computed(() => {
  const relevantRunsHaveNotLoaded = !relevantRuns.value.all
  const queryIsBeingFetched = query.fetching.value

  const cloudProject = query.data.value?.currentProject?.cloudProject?.__typename === 'CloudProject'
    ? query.data.value?.currentProject?.cloudProject
    : null

  const currentRunNumber = relevantRuns.value?.selectedRun?.runNumber
  const cachedRunNumber = cachedProject.value?.currentProject?.cloudProject?.__typename === 'CloudProject'
    ? cachedProject.value.currentProject.cloudProject.runByNumber?.runNumber : undefined
  const currentRunIsChanging = currentRunNumber !== cachedRunNumber
  const waitingForRunToFetchFromTheCloud = !!currentRunNumber && currentRunNumber > 0
    && (!cloudProject || !cloudProject.runByNumber?.status)

  return relevantRunsHaveNotLoaded || (currentRunIsChanging && (queryIsBeingFetched || waitingForRunToFetchFromTheCloud))
})

watchEffect(() => {
  if (query.data.value?.currentProject?.cloudProject?.__typename === 'CloudProject') {
    const cloudProject = query.data.value.currentProject.cloudProject

    if (cloudProject.runByNumber !== undefined) {
      cachedProject.value = query.data.value
    }
  }
})

useSubscription({ query: Debug_SpecsChangeDocument })

</script>
