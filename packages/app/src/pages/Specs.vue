<template>
  <div>
    <h2>Specs Page</h2>
    <template v-if="query.data.value?.app">
      <SpecsList :gql="query.data.value?.app" />
    </template>
  </div>
</template>

<script lang="ts" setup>
import { gql } from '@urql/core'
import { useQuery } from '@urql/vue'
import { Specs_AppDocument } from '../generated/graphql'
import SpecsList from '../specs/SpecsList.vue'

gql`
query Specs_App {
  app {
    ...SpecsList
  } 
}
`

const query = useQuery({
  query: Specs_AppDocument,
})

</script>
<route>
{
  name: "Specs Page"
}
</route>
