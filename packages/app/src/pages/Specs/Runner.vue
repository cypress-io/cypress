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
import { gql, useQuery } from '@urql/vue'
import { SpecPageContainerDocument } from '../../generated/graphql'
import { getAutIframeModel } from '../../runner'
import SpecRunnerContainerOpenMode from '../../runner/SpecRunnerContainerOpenMode.vue'
import SpecRunnerContainerRunMode from '../../runner/SpecRunnerContainerRunMode.vue'
import { togglePlayground } from '../../runner/utils'

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

// @ts-ignore - this is used for exposing the selector playground in e2e tests
// TODO: migrate this to true e2e test w/o the hack using Cypress-in-Cypress when
// that is supported.
window.__showSelectorPlaygroundForTestingPurposes = () => {
  togglePlayground(getAutIframeModel())
}

</script>

<route>
  {
    meta: {
      header: false,
      navBarExpandedAllowed: false
    }
  }
</route>
