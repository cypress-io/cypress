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
query Debug {
  ...DebugSpecs
}
`

const query = useQuery({ query: DebugDocument })

useSubscription({ query: Debug_SpecsChangeDocument })

</script>
