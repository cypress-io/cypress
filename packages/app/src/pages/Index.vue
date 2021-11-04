<template>
  <div v-if="query.data.value">
    <SpecsList :gql="query.data.value" />
  </div>

  <div v-else>
    Loading...
  </div>
</template>

<script lang="ts" setup>
import { gql, useQuery } from '@urql/vue'
import SpecsList from '../specs/SpecsList.vue'
import { SpecsPageContainerDocument } from '../generated/graphql'

gql`
query SpecsPageContainer {
  ...Specs_SpecsList
}
`

const query = useQuery({ query: SpecsPageContainerDocument })

</script>

<route>
{
  name: "Specs Page",
  meta: {
    title: "Specs"
  }
}
</route>
