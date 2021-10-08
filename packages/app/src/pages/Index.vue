<template>
  <div>
    <div v-if="query.fetching.value">
      Loading...
    </div>
    <div v-else-if="query.data.value?.app?.activeProject">
      <Specs :gql="query.data.value.app" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { gql, useQuery } from '@urql/vue'
import Specs from './Specs.vue'
import { IndexDocument } from '../generated/graphql'

gql`
query Index {
  app {
    ...Specs_Specs
  }
}`

const query = useQuery({ query: IndexDocument })
</script>

<route>
{
  name: "Home Page"
}
</route>
