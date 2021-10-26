<template>
  <div>
    Header bar
    {{ queryApp?.app?.activeProject?.id }}
  </div>
</template>

<script setup lang="ts">

import { gql, useQuery } from '@urql/vue'
import { computed } from 'vue'
import {
  HeaderBar_HeaderBarQueryDocument,
} from '../generated/graphql'

gql`
query HeaderBar_HeaderBarQuery {
    app {
        activeProject {
            id
        }
    }
}`

const headerBarQuery = useQuery({ query: HeaderBar_HeaderBarQueryDocument })
const queryApp = computed(() => {
  return headerBarQuery.data?.value
})

</script>
