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
import DebugLoading from '../debug/DebugLoading.vue'
import { gql, useQuery } from '@urql/vue'
import { DebugDocument } from '../generated/graphql'

gql `
query Debug {
   ...DebugSpecs
}
`

const query = useQuery({ query: DebugDocument })

</script>
