<template>
  <div>
    <!--
      Run Mode is a more minimal UI.
      It does not render things like the SpecList,
      Side and Top Nav, etc.
      It also has no GraphQL dependency.
    -->
    <SpecRunnerContainerRunMode
      v-if="isRunMode"
      :run-mode-specs="specs"
    />

    <!--
      Open Mode is the full Cypress runner UI -
      including things like the SpecList,
      Side and Top Nav, Selector Playgroundn etc.
      It is driven by GraphQL and urql.
    -->
    <SpecRunnerContainerOpenMode
      v-else-if="query.data.value?.currentProject?.specs"
      :gql="query.data.value"
    />
  </div>
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

const isRunMode = window.__CYPRESS_MODE__ === 'run'

// in run mode, we are not using GraphQL or urql
// for performance - run mode does not need the
// same level of runner interactivity as open mode.
// by setting `pause: true` in run mode, urql will not trigger any
// requests, which is what we want.
const query = useQuery({
  query: SpecPageContainerDocument,
  requestPolicy: 'cache-only',
  pause: isRunMode && window.top === window,
})

// because we are not using GraphQL in run mode, and we still need
// way to get the specs, we simply attach them to window when
// serving the initial HTML.
// this works fine - we know that during run mode, no new specs will
// be added or removed.
const specs = window.__RUN_MODE_SPECS__

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

<style lang="scss">

iframe.aut-iframe {
  width: 100%;
  height: 100%;
  background: white;
}

iframe.spec-iframe {
    border: none;
    height: 0;
    position: absolute;
    visibility: hidden;
    width: 0;
}

.highlight {
  background: rgba(159, 196, 231, 0.6);
  border: solid 2px #9FC4E7;
  cursor: pointer;
}

.tooltip {
  font-family: sans-serif;
  font-size: 14px;
  max-width: 400px !important;
}

#unified-runner {
  position: relative;
    margin: 0 auto;
}

.is-screenshotting #unified-runner {
    margin: unset;
}

#unified-runner > .screenshot-height-container {
  height: 100%
}

.is-screenshotting #unified-runner > .screenshot-height-container {
  height: min(100%, 100vh);
}

</style>
