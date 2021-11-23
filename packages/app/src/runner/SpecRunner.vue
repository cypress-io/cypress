<template>
  <RemovePositioningDuringScreenshot
    id="main-pane"
    class="flex border-l-1 border-gray-900"
  >
    <HideDuringScreenshot
      id="inline-spec-list"
      class="bg-gray-1000"
    >
      <InlineSpecList :gql="props.gql" />
    </HideDuringScreenshot>

    <HideDuringScreenshot class="w-128">
      <div
        v-once
        :id="REPORTER_ID"
      />
    </HideDuringScreenshot>

    <div
      ref="runnerPane"
      class="relative w-full"
    >
      <HideDuringScreenshot class="bg-white p-4">
        <SpecRunnerHeader
          :gql="props.gql"
          :event-manager="eventManager"
          :get-aut-iframe="getAutIframeModel"
        />
      </HideDuringScreenshot>

      <RemoveClassesDuringScreenshotting
        class="flex justify-center bg-gray-100 h-full p-4"
      >
        <div
          :id="RUNNER_ID"
          class="viewport origin-top-left"
          :style="viewportStyle"
        />
      </RemoveClassesDuringScreenshotting>

      <SnapshotControls
        :event-manager="eventManager"
        :get-aut-iframe="getAutIframeModel"
      />
      <ScreenshotHelperPixels />
    </div>
  </RemovePositioningDuringScreenshot>
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
import HideDuringScreenshot from './screenshot/HideDuringScreenshot.vue'
import RemoveClassesDuringScreenshotting from './screenshot/RemoveClassesDuringScreenshotting.vue'
import RemovePositioningDuringScreenshot from './screenshot/RemovePositioningDuringScreenshot.vue'
import ScreenshotHelperPixels from './screenshot/ScreenshotHelperPixels.vue'
import { useScreenshotStore } from '../store/screenshot-store'

gql`
fragment SpecRunner on CurrentProject {
  id
  ...Specs_InlineSpecList
  ...SpecRunnerHeader
}
`

const eventManager = getEventManager()

const autStore = useAutStore()
const screenshotStore = useScreenshotStore()

const runnerPane = ref<HTMLDivElement>()

const viewportStyle = computed(() => {
  if (!runnerPane.value) {
    return
  }

  let scale: number

  if (screenshotStore.isScreenshotting) {
    scale = 1
  } else {
    scale = runnerPane.value.clientWidth < autStore.viewportDimensions.width
      ? runnerPane.value.clientWidth / autStore.viewportDimensions.width
      : 1
  }

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
  const eventManager = getEventManager()

  eventManager.on('restart', () => {
    runSpec()
  })

  eventManager.on('before:screenshot', (payload) => {
    if (payload.appOnly) {
      screenshotStore.setScreenshotting(true)
    }
  })

  eventManager.on('after:screenshot', () => {
    screenshotStore.setScreenshotting(false)
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
  height: 100vh;
}

#inline-spec-list {
  border-right: 2px solid rgb(67 73 97);
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
  height: min(100%, 100vh);
}

iframe {
  width: 100%;
  height: 100%;
  background: white;
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

</style>
