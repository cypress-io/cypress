<template>
  <div v-if="query.data.value">
    <SpecsList
      v-if="query.data.value.currentProject?.specs?.edges.length"
      :gql="query.data.value"
    />
    <CreateSpecPage
      v-else
      :gql="query.data.value"
    />
  </div>

  <div v-else>
    Loading...
  </div>
</template>

<script lang="ts" setup>
import { gql, useQuery } from '@urql/vue'
import SpecsList from '../specs/SpecsList.vue'
import { SpecsPageContainerDocument } from '../generated/graphql'
import CreateSpecPage from '../specs/CreateSpecPage.vue'

gql`
query SpecsPageContainer {
  ...Specs_SpecsList
  ...CreateSpecPage
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
