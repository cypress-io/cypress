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
        class="viewport origin-top-left"
        :style="viewportStyle"
      />
      <div>Viewport: {{ viewportDimensions.width }}px x {{ viewportDimensions.height }}px</div>
    </div>

    <div
      v-once
      :id="REPORTER_ID"
    />

    <div
      v-once
      :id="MESSAGE_ID"
    />
    <!-- <SnapshotControls
      :eventManager="eventManager"
    /> -->
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, reactive, watch } from 'vue'
import { REPORTER_ID, RUNNER_ID, MESSAGE_ID, getRunnerElement, getReporterElement, empty } from '../runner/utils'
import { gql } from '@urql/core'
import type { SpecRunnerFragment } from '../generated/graphql'
import InlineSpecList from '../specs/InlineSpecList.vue'
import { getMobxRunnerStore, useSpecStore } from '../store'
import { UnifiedRunnerAPI } from '../runner'
import type { BaseSpec } from '@packages/types'
import SnapshotControls from './SnapshotsControls.vue'

gql`
fragment SpecRunner on App {
  ...Specs_InlineSpecList
}
`

const runnerColumnWidth = 400

const eventManager = window.UnifiedRunner.eventManager

const mobxRunnerStore = getMobxRunnerStore()

const viewportDimensions = reactive({
  height: mobxRunnerStore.height,
  width: mobxRunnerStore.width,
})

window.UnifiedRunner.MobX.reaction(
  () => [mobxRunnerStore.height, mobxRunnerStore.width],
  ([height, width]) => {
    viewportDimensions.height = height
    viewportDimensions.width = width
  },
)

window.UnifiedRunner.MobX.reaction(
  () => [mobxRunnerStore.messageTitle, mobxRunnerStore.messageControls],
  ([title, controls]) => {
    const store = getMobxRunnerStore()
    const message = window.UnifiedRunner.React.createElement(
      window.UnifiedRunner.Message,
      {
        state: {
          messageTitle: store.messageTitle,
          messageControls: store.messageControls,
          messageDescription: store.messageDescription,
          messageType: store.messageType,
          messageStyles: {
            state: store.messageStyles.state,
            styles: store.messageStyles.styles,
            messageType: store.messageType,
          },
        },
      },
    )

    window.UnifiedRunner.ReactDOM.render(message, document.querySelector(`#${MESSAGE_ID}`))
    // viewportDimensions.height = height
    // viewportDimensions.width = width
  },
)

const viewportStyle = computed(() => {
  return `
  width: ${viewportDimensions.width}px;
  height: ${viewportDimensions.height}px;
  transform: scale(${runnerColumnWidth / viewportDimensions.width});`
})

const props = defineProps<{
  gql: SpecRunnerFragment
  activeSpec: BaseSpec
}>()

function runSpec () {
  UnifiedRunnerAPI.executeSpec(props.activeSpec)
}

watch(() => props.activeSpec, (spec) => {
  runSpec()
}, { immediate: true, flush: 'post' })

onMounted(() => {
  window.UnifiedRunner.eventManager.on('restart', () => {
    runSpec()
  })
})

onBeforeUnmount(() => {
  // Clean up the AUT and Reporter every time we leave the route.
  empty(getRunnerElement())

  // TODO: this should be handled by whoever starts it, reporter?
  window.UnifiedRunner.shortcuts.stop()

  empty(getReporterElement())
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
