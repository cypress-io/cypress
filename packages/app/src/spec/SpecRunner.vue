<template>
  <div
    id="main-pane"
    class="flex"
  >
    <div
      id="inline-spec-list"
      class="bg-gray-1000 w-128"
    >
      <InlineSpecList :gql="props.gql" />
    </div>

    <div class="w-128">
      <div
        v-once
        :id="REPORTER_ID"
      />
    </div>

    <div
      ref="runnerPane"
      class="relative w-full"
    >
      <div class="bg-white p-4">
        <SpecRunnerHeader :gql="props.gql" />
      </div>

      <div class="flex justify-center bg-gray-100 h-full p-4">
        <div
          :id="RUNNER_ID"
          class="viewport origin-top-left"
          :style="viewportStyle"
        />
      </div>
      <SnapshotControls :event-manager="eventManager" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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

const eventManager = window.UnifiedRunner.eventManager

const autStore = useAutStore()

const runnerPane = ref<HTMLDivElement>()

const viewportStyle = computed(() => {
  if (!runnerPane.value) {
    return
  }

  const scale = runnerPane.value.clientWidth < autStore.viewportDimensions.width
    ? runnerPane.value.clientWidth / autStore.viewportDimensions.width
    : 1

  return `
  width: ${autStore.viewportDimensions.width}px;
  height: ${autStore.viewportDimensions.height}px;
  transform: scale(${scale});`
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

<style scoped lang="scss">
#main-pane {
  height: 100vh;
}

#inline-spec-list {
  border-right: 2px solid rgb(67 73 97);
}

.viewport {
  border: 2px dotted blue;
}

#unified-runner {
  position: relative;
}

#unified-reporter {
  position: relative;
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
