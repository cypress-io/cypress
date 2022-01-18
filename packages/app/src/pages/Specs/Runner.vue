<template>
  <SpecRunnerContainerRunMode
    v-if="runMode"
    :run-mode-specs="specs"
  />

  <SpecRunnerContainerOpenMode
    v-else-if="query.data.value?.currentProject?.specs"
    :gql="query.data.value"
  />
</template>

<script lang="ts" setup>
import type { SpecFile } from '@packages/types/src'
import { gql, useQuery } from '@urql/vue'
import { SpecPageContainerDocument } from '../../generated/graphql'
import SpecRunnerContainerOpenMode from '../../runner/SpecRunnerContainerOpenMode.vue'
import SpecRunnerContainerRunMode from '../../runner/SpecRunnerContainerRunMode.vue'

gql`
query SpecPageContainer {
  ...SpecRunner
}
`

const runMode = window.__CYPRESS_MODE__ === 'run'
const specs = window.__RUN_MODE_SPECS__

const query = useQuery({
  query: SpecPageContainerDocument,
  requestPolicy: window.__CYPRESS_MODE__ === 'run' && window.top === window ? 'cache-only' : 'cache-and-network',
})
</script>

<route>
  {
    meta: {
      header: false,
      navBarExpandedAllowed: false
    }
  }
</route>
