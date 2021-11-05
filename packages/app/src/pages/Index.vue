<template>
  <div v-if="query.data.value?.app">
    <SpecsList
      v-if="query.data.value.app.activeProject?.specs"
      :gql="query.data.value.app"
    />
    <CreateSpecPage
      v-else
      :gql="query.data.value.app"
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
  app {
    ...Specs_SpecsList
    ...CreateSpecPage
  }
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
