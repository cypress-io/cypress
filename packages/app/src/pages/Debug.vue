<template>
  <TransitionQuickFade>
    <DebugLoading v-if="isLoading" />
    <DebugContainer
      v-else
      data-cy="debug-container"
      :gql="query.data.value"
    />
  </TransitionQuickFade>
</template>

<script setup lang="ts">

import DebugContainer from '../debug/DebugContainer.vue'
import DebugLoading from '../debug/empty/DebugLoading.vue'
import { gql, useQuery, useSubscription } from '@urql/vue'
import { DebugDocument, Debug_SpecsChangeDocument } from '../generated/graphql'
import { ref, watchEffect, computed } from 'vue'
import TransitionQuickFade from '@cy/components/transitions/TransitionQuickFade.vue'
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

const hasLoadedFirstTime = ref(false)

const relevantRuns = useRelevantRun()

const variables = computed(() => {
  return {
    runNumber: relevantRuns.value?.current || -1,
    nextRunNumber: relevantRuns.value?.next || -1,
    hasNextRun: !!relevantRuns.value?.next,
  }
})

const query = useQuery({ query: DebugDocument, variables, pause: true, requestPolicy: 'network-only' })

const isLoading = computed(() => {
  return !hasLoadedFirstTime.value || query.fetching.value
})

watchEffect(() => {
  if (relevantRuns.value?.current) {
    query.executeQuery()
    hasLoadedFirstTime.value = true
  }
})

useSubscription({ query: Debug_SpecsChangeDocument })

</script>
