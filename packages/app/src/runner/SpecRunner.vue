<template>
  <div
    id="main-pane"
    class="flex"
  >
    <div
      id="inline-spec-list"
      class="bg-gray-1000"
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
      <div class="bg-white p-4  border-8 border-blue-300">
        <SpecRunnerHeader :gql="props.gql" />
      </div>

      <div class="flex justify-center bg-gray-100 h-full p-4">
        <div
          :id="RUNNER_ID"
          class="viewport origin-top-left"
          :style="viewportStyle"
        />
      </div>
      <SnapshotControls
        :event-manager="eventManager"
        :get-aut-iframe="getAutIframeModel"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { REPORTER_ID, RUNNER_ID, getRunnerElement, getReporterElement, empty } from '../runner/utils'
import { gql } from '@urql/core'
import type { SpecRunnerFragment } from '../generated/graphql'
import InlineSpecList from '../specs/InlineSpecList.vue'
import { getAutIframeModel, getEventManager, UnifiedRunnerAPI } from '../runner'
import { useAutStore } from '../store'
import type { BaseSpec } from '@packages/types'
import SnapshotControls from './SnapshotControls.vue'
import SpecRunnerHeader from './SpecRunnerHeader.vue'

gql`
fragment SpecRunner on App {
  ...Specs_InlineSpecList
  ...SpecRunnerHeader
}
`

const eventManager = getEventManager()

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
  getEventManager().on('restart', () => {
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
$navbar-width: 80px;

#main-pane {
  /** There is a "bug" caused by this line:
    https://github.com/cypress-io/cypress/blob/develop/packages/driver/src/cy/actionability.ts#L375
    Basically `scrollIntoView` is applied even outside of the <iframe>,
    scrolling an element "upwards", messing up the UI
    Easiest way to reprodudce is remove the `position: fixed`
    and run the `SpecList.spec.tsx` test in runner-ct
    in CT mode.
    Ideally we should not need `position: fixed`, but I don't see
    a good way to work around this right now.
  */
  position: fixed;
  left: $navbar-width;
  height: 100vh;
  width: calc(100% - #{$navbar-width});
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
