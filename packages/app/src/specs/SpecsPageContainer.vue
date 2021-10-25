<template>
  <div v-if="query.data.value?.app">
    <h2>Specs Page</h2>
    <SpecsList :gql="query.data.value.app" />
  </div>

  <div v-else>
    Loading...
  </div>
</template>

<script lang="ts" setup>
import { gql, useQuery } from '@urql/vue'
import SpecsList from './SpecsList.vue'
import { SpecsPageContainerDocument } from '../generated/graphql'

gql`
query SpecsPageContainer {
  app {
    ...Specs_SpecsList
  }
}
`

const query = useQuery({ query: SpecsPageContainerDocument })

</script>
