<template>
  <DebugLoading v-if="query.fetching.value" />
  <DebugContainer
    v-else
    data-cy="debug-container"
    :gql="query.data.value"
  />
</template>

<script setup lang="ts">

import DebugContainer from '../debug/DebugContainer.vue'
import DebugLoading from '../debug/empty/DebugLoading.vue'
import { gql, useQuery, useSubscription } from '@urql/vue'
import { DebugDocument, Debug_SpecsChangeDocument } from '../generated/graphql'
import { ref, watchEffect } from 'vue'
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

const variables = ref({ runNumber: -1, nextRunNumber: -1, hasNextRun: false })

const query = useQuery({ query: DebugDocument, variables, pause: true })

watchEffect(() => {
  if (relevantRuns.value.current) {
    variables.value.runNumber = relevantRuns.value.current
    variables.value.hasNextRun = !!relevantRuns.value.next
    variables.value.nextRunNumber = relevantRuns.value.next || -1
    query.executeQuery()
  }
})

useSubscription({ query: Debug_SpecsChangeDocument })

</script>
