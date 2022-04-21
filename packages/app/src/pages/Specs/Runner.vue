<template>
  <div>
    <!--
      Run Mode is a more minimal UI.
      It does not render things like the SpecList,
      Side Nav, etc.
      It also has no GraphQL dependency.
    -->
    <SpecRunnerContainerRunMode
      v-if="isRunMode"
      :run-mode-specs="specs"
    />

    <!--
      Open Mode is the full Cypress runner UI -
      including things like the SpecList,
      Side Nav, Selector Playground etc.
      It is driven by GraphQL and urql.
    -->
    <SpecRunnerContainerOpenMode
      v-else-if="query.data.value?.currentProject?.specs"
      :gql="query.data.value"
    />
  </div>
</template>

<script lang="ts" setup>
import { gql, useQuery, useSubscription } from '@urql/vue'
import { SpecPageContainerDocument, SpecPageContainer_SpecsChangeDocument } from '../../generated/graphql'
import SpecRunnerContainerOpenMode from '../../runner/SpecRunnerContainerOpenMode.vue'
import SpecRunnerContainerRunMode from '../../runner/SpecRunnerContainerRunMode.vue'

gql`
query SpecPageContainer {
  ...SpecRunner
}
`

gql`
subscription SpecPageContainer_specsChange {
  specsChange {
    id
    specs {
      id
      ...SpecNode_InlineSpecList
    }
  }
}
`

gql`
subscription Runner_ConfigChange {
  configChange {
    id
    ...SpecRunner_Config
  }
}
`

const isRunMode = window.__CYPRESS_MODE__ === 'run'

// subscriptions are used to trigger live updates without
// reloading the page.
// this is only useful in open mode - in run mode, we don't
// use GraphQL, so we pause the
// subscriptions so they never execute.
const shouldPauseSubscriptions = isRunMode && window.top === window

let initialLoad = true

useSubscription({
  query: SpecPageContainer_SpecsChangeDocument,
  pause: shouldPauseSubscriptions,
}, () => {
  // if the `config` changed, we want to reload the entire
  // page and re-execute the current test with the latest config
  // values
  // subscriptions trigger on the initial page load,
  // so we do not want to trigger `window.location.reload` on the
  // first load, or we get stuck in an infinite loop.
  if (!initialLoad) {
    window.location.reload()
  }

  initialLoad = false
})

// in run mode, we are not using GraphQL or urql
// for performance - run mode does not need the
// same level of runner interactivity as open mode.
// by setting `pause: true` in run mode, urql will not trigger any
// requests, which is what we want.
const query = useQuery({
  query: SpecPageContainerDocument,
  pause: shouldPauseSubscriptions,
})

// useSubscription({ query: Runner_ConfigChangeDocument })

// because we are not using GraphQL in run mode, and we still need
// way to get the specs, we simply attach them to window when
// serving the initial HTML.
// this works fine - we know that during run mode, no new specs will
// be added or removed.
const specs = window.__RUN_MODE_SPECS__

</script>

<route>
  {
    name: 'SpecRunner',
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
