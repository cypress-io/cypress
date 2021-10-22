<template>
  <div v-if="query.data.value?.app">
    <div v-if="specStore.currentSpec">
      <SpecRunnerContainer :gql="query.data.value.app" />
    </div>

    <template v-else>
      <h2>Specs Page</h2>
      <SpecsList :gql="query.data.value.app" />
    </template>
  </div>

  <div v-else>
    Loading...
  </div>
</template>

<script lang="ts" setup>
import { gql, useQuery } from '@urql/vue'
import { onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
import SpecsList from '../specs/SpecsList.vue'
import SpecRunnerContainer from './SpecRunnerContainer.vue'
import { useSpecStore } from '../store'
import { SpecsPageContainerDocument } from '../generated/graphql'
import { UnifiedRunnerAPI } from '../runner'

gql`
query SpecsPageContainer {
  app {
    ...Specs_SpecsList
  }
}
`

const query = await useQuery({ query: SpecsPageContainerDocument })

const route = useRoute()
const specStore = useSpecStore()

const stopWatchingSpecQuery = watch(() => route.query.spec, (relative) => {
  const spec = query.data.value?.app.activeProject?.specs?.edges.find((x) => x.node.relative === relative)?.node

  specStore.setCurrentSpec(spec ?? null)

  if (specStore.currentSpec) {
    UnifiedRunnerAPI.executeSpec(specStore.currentSpec)
  }
}, { immediate: true })

onBeforeUnmount(() => {
  stopWatchingSpecQuery()
})

</script>
