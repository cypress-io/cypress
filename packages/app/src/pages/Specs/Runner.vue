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
import { gql, useQuery, SubscriptionHandlerArg } from '@urql/vue'
import { SpecPageContainerDocument, SpecPageContainer_SpecsChangeDocument, Runner_ConfigChangeDocument, Runner_ConfigChangeSubscription } from '../../generated/graphql'
import SpecRunnerContainerOpenMode from '../../runner/SpecRunnerContainerOpenMode.vue'
import SpecRunnerContainerRunMode from '../../runner/SpecRunnerContainerRunMode.vue'
import { useEventManager } from '../../runner/useEventManager'
import { useSpecStore } from '../../store'
import { isRunMode } from '@packages/frontend-shared/src/utils/isRunMode'
import { useSubscription } from '../../graphql'

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
    serveConfig
  }
}
`

// subscriptions are used to trigger live updates without
// reloading the page.
// this is only useful in open mode - in run mode, we don't
// use GraphQL, so we pause the
// subscriptions so they never execute.
useSubscription({
  query: SpecPageContainer_SpecsChangeDocument,
  pause: isRunMode,
})

// in run mode, we are not using GraphQL or urql
// for performance - run mode does not need the
// same level of runner interactivity as open mode.
// by setting `pause: true` in run mode, urql will not trigger any
// requests, which is what we want.
const query = useQuery({
  query: SpecPageContainerDocument,
  pause: isRunMode,
})

let initialLoad = true

const specStore = useSpecStore()

// When cypress.config.js is changed,
// we respond by updating the runner with the latest config
// and re-running the current spec with the new config values.
const configChangeHandler: SubscriptionHandlerArg<any, any> = (
  _prev: Runner_ConfigChangeSubscription | undefined,
  next: Runner_ConfigChangeSubscription,
) => {
  if (!next.configChange?.serveConfig) {
    throw Error(`Did not get expected serveConfig from subscription`)
  }

  if (!initialLoad && specStore.activeSpec) {
    try {
      // Update the config used by the runner with the new one.
      window.__CYPRESS_CONFIG__ = next.configChange.serveConfig

      const eventManager = useEventManager()
      const isRerun = true

      eventManager.runSpec(isRerun)
    } catch (e) {
      // eventManager may not be defined, for example if the spec
      // is still loading.
      // In that case, just do nothing - the spec will be executed soon.
      // This only happens when re-executing a spec after
      // cypress.config.js was changed.
    }
  }

  initialLoad = false
}

useSubscription({ query: Runner_ConfigChangeDocument }, configChangeHandler)

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

.is-screenshotting #main-pane {
  overflow: auto !important;
}

.is-screenshotting.screenshot-scrolling #main-pane {
  overflow: visible !important;
}

#resizable-panels-root {
  overflow-x: auto;
  overflow-y: hidden;
}

.is-screenshotting #resizable-panels-root {
  overflow-x: visible;
  overflow-y: visible;
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
