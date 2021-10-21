<template>
  <div
    id="main-grid"
    class="grid p-12 gap-8 h-full"
  >
    <div>
      <InlineSpecList :gql="props.gql" />
    </div>

    <div
      id="runner"
      :style="`width: ${runnerColumnWidth}px`"
    >
      <div
        :id="RUNNER_ID"
        class="viewport origin-left"
        :style="viewportStyle"
      />
      <div>Viewport: {{ viewportDimensions.width }}px x {{ viewportDimensions.height }}px</div>
    </div>

    <div
      v-once
      :id="REPORTER_ID"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, reactive, watch } from 'vue'
import { REPORTER_ID, RUNNER_ID, getRunnerElement, getReporterElement, empty } from '../runner/utils'
import { gql } from '@urql/core'
import type { Specs_RunnerFragment } from '../generated/graphql'
import InlineSpecList from '../specs/InlineSpecList.vue'
import { getMobXStore } from '../store'
import { useRoute } from 'vue-router'
import { useSpecStore } from '../composables/specStore'

gql`
fragment Specs_Runner on App {
  ...Specs_InlineSpecList
  activeProject {
    id
    projectRoot
  }
}
`

gql`
mutation Runner_SetCurrentSpec($id: ID!) {
  setCurrentSpec(id: $id)
}
`

const runnerColumnWidth = 400

const store = getMobXStore()

const viewportDimensions = reactive({
  height: store.height,
  width: store.width,
})

window.UnifiedRunner.MobX.reaction(
  () => [store.height, store.width],
  ([height, width]) => {
    viewportDimensions.height = height
    viewportDimensions.width = width
  },
)

const viewportStyle = computed(() => {
  return `
  width: ${viewportDimensions.width}px;
  height: ${viewportDimensions.height}px;
  transform: scale(${runnerColumnWidth / viewportDimensions.width})
`
})

const props = defineProps<{
  gql: Specs_RunnerFragment
}>()

const specStore = useSpecStore()
const route = useRoute()

function runSpec () {
  const relative = route.query.spec
  const spec = props.gql.activeProject?.specs?.edges.find((x) => x.node.relative === relative)?.node

  if (!spec) {
    return
  }

  specStore.setSpec(spec)
}

const stopWatchingSpec = watch(
  () => route.query.spec,
  (relative) => {
    const spec = props.gql.activeProject?.specs?.edges.find((x) => x.node.relative === relative)?.node

    if (!spec) {
      return
    }

    specStore.setSpec(spec)
  },
)

onMounted(() => {
  window.UnifiedRunner.eventManager.on('restart', () => {
    runSpec()
  })

  runSpec()
})

onBeforeUnmount(() => {
  // Clean up the AUT and Reporter every time we leave the route.
  empty(getRunnerElement())

  // TODO: this should be handled by whoever starts it, reporter?
  window.UnifiedRunner.shortcuts.stop()

  empty(getReporterElement())

  // stop watching the spec query param in the url
  stopWatchingSpec()
})

</script>

<style scoped>
#main-grid {
  grid-template-columns: 1fr 2fr 2fr;
}

.viewport {
  border: 2px dotted blue;
}

#runner {
  border: 1px solid black;
}

#unified-runner {
  position: relative;
}

#unified-reporter {
  position: relative;
  width: 300px;
  height: 100%;
}
</style>

<route>
{
  name: "Runner"
}
</route>

<style>
#unified-runner > div {
  height: 100%;
}

iframe {
  width: 100%;
  height: 100%;
}
</style>
