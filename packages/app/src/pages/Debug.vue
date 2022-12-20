<template>
  <DebugContainer
    data-cy="debug-container"
    :loading="query.fetching.value"
    :gql="query.data.value"
  />
</template>

<script setup lang="ts">

import DebugContainer from '../debug/DebugContainer.vue'
import { gql, useQuery } from '@urql/vue'
import { DebugDocument } from '../generated/graphql'

gql `
query Debug {
   ...DebugSpecs
}
`

const query = useQuery({ query: DebugDocument })

</script>
