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
import { useRelevantRun } from '@packages/app/src/composables/useRelevantRun'

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
query Debug($runNumber: Int!) {
   ...DebugSpecs
}
`

const relevantRuns = useRelevantRun()

const variables = ref({ runNumber: -1 })

const query = useQuery({ query: DebugDocument, variables, pause: true })

watchEffect(() => {
  if (relevantRuns.value.completed) {
    variables.value.runNumber = relevantRuns.value.completed
    query.executeQuery()
  }
})

useSubscription({ query: Debug_SpecsChangeDocument })

</script>
