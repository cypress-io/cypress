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
      class="relative"
    >
      <SpecRunnerHeader :gql="props.gql" />
      <div
        :id="RUNNER_ID"
        class="viewport origin-top-left"
        :style="viewportStyle"
      />
      <SnapshotControls :event-manager="eventManager" />
    </div>

    <div
      v-once
      :id="REPORTER_ID"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { REPORTER_ID, RUNNER_ID, getRunnerElement, getReporterElement, empty } from '../runner/utils'
import { gql } from '@urql/core'
import type { SpecRunnerFragment } from '../generated/graphql'
import InlineSpecList from '../specs/InlineSpecList.vue'
import { useAutStore } from '../store'
import { UnifiedRunnerAPI } from '../runner'
import type { BaseSpec } from '@packages/types'
import SnapshotControls from './SnapshotControls.vue'
import SpecRunnerHeader from './SpecRunnerHeader.vue'

gql`
fragment SpecRunner on App {
  ...Specs_InlineSpecList
  ...SpecRunnerHeader
}
`

const runnerColumnWidth = 400
const eventManager = window.UnifiedRunner.eventManager

const autStore = useAutStore()

const viewportStyle = computed(() => {
  return `
  width: ${autStore.viewportDimensions.width}px;
  height: ${autStore.viewportDimensions.height}px;
  transform: scale(${runnerColumnWidth / autStore.viewportDimensions.width});`
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
