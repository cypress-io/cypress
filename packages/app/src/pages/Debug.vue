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
import { DebugDocument, Debug_SpecsChangeDocument, Debug_RelevantRunsDocument } from '../generated/graphql'
import { ref, watchEffect } from 'vue'

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

gql`
  query Debug_RelevantRuns {
    currentProject {
      id
      relevantRuns
    }
  }
`

const runsQuery = useQuery({ query: Debug_RelevantRunsDocument })

const variables = ref({ runNumber: -1 })

const query = useQuery({ query: DebugDocument, variables, pause: true })

watchEffect(() => {
  const relevantRuns = runsQuery.data.value?.currentProject?.relevantRuns
  const relevantRun = relevantRuns ? relevantRuns[0] : undefined

  if (relevantRun) {
    variables.value.runNumber = relevantRun
    query.executeQuery()
  }
})

useSubscription({ query: Debug_SpecsChangeDocument })

</script>
