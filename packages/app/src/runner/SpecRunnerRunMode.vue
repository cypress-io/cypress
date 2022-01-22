<template>
  <RemovePositioningDuringScreenshot
    id="main-pane"
    class="flex border-gray-900 border-l-1"
  >
    <ResizablePanels
      :max-total-width="windowWidth"
      :initial-panel1-width="0"
      :initial-panel2-width="reporterWidth"
      :show-panel1="false"
      :show-panel2="!screenshotStore.isScreenshotting"
      @resize-end="handleResizeEnd"
      @panel-width-updated="handlePanelWidthUpdated"
    >
      <!-- TODO(mark): - allow show-panel-2 to be true in screenshots if including the reporter is intended -->
      <template #panel1="{isDragging}">
        <HideDuringScreenshotOrRunMode
          v-show="runnerUiStore.isSpecsListOpen"
          id="inline-spec-list"
          class="h-full bg-gray-1000 border-r-1 border-gray-900"
          :class="{'pointer-events-none': isDragging}"
        />
      </template>
      <template #panel2>
        <HideDuringScreenshot
          class="h-full"
        >
          <div
            v-once
            :id="REPORTER_ID"
            class="w-full"
          />
        </HideDuringScreenshot>
      </template>
      <template #panel3>
        <RemoveClassesDuringScreenshotting
          class="h-full bg-gray-100 p-16px"
        >
          <ScriptError
            v-if="autStore.scriptError"
            :error="autStore.scriptError.error"
          />
          <div
            v-show="!autStore.scriptError"
            :id="RUNNER_ID"
            class="origin-top-left viewport"
            :style="viewportStyle"
          />
          <AutomationElement />
          <!--
            TODO: Figure out bugs in automation lifecycle
            Put these guys back in.
            <AutomationMissing v-if="runnerUiStore.automationStatus === 'MISSING'" />
            <AutomationDisconnected v-if="runnerUiStore.automationStatus === 'DISCONNECTED'" />
          -->
        </RemoveClassesDuringScreenshotting>
        <SnapshotControls
          :event-manager="eventManager"
          :get-aut-iframe="getAutIframeModel"
        />
        <ScreenshotHelperPixels />
      </template>
    </ResizablePanels>
  </RemovePositioningDuringScreenshot>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted } from 'vue'
import { REPORTER_ID, RUNNER_ID } from './utils'
import { getAutIframeModel, getEventManager } from '.'
import { useAutStore, useRunnerUiStore } from '../store'
import SnapshotControls from './SnapshotControls.vue'
import HideDuringScreenshot from './screenshot/HideDuringScreenshot.vue'
import RemoveClassesDuringScreenshotting from './screenshot/RemoveClassesDuringScreenshotting.vue'
import RemovePositioningDuringScreenshot from './screenshot/RemovePositioningDuringScreenshot.vue'
import ScreenshotHelperPixels from './screenshot/ScreenshotHelperPixels.vue'
import { useScreenshotStore } from '../store/screenshot-store'
import ScriptError from './ScriptError.vue'
import ResizablePanels from './ResizablePanels.vue'
import HideDuringScreenshotOrRunMode from './screenshot/HideDuringScreenshotOrRunMode.vue'
import AutomationDisconnected from './automation/AutomationDisconnected.vue'
import AutomationMissing from './automation/AutomationMissing.vue'
import AutomationElement from './automation/AutomationElement.vue'
import { useResizablePanels, useRunnerStyle } from './useRunnerStyle'
import { useEventManager } from './useEventManager'

const eventManager = getEventManager()

const autStore = useAutStore()
const screenshotStore = useScreenshotStore()
const runnerUiStore = useRunnerUiStore()

const {
  viewportStyle,
  windowWidth,
  reporterWidth,
  specListWidth,
} = useRunnerStyle()

const {
  handlePanelWidthUpdated,
  handleResizeEnd,
} = useResizablePanels()

const {
  initializeRunnerLifecycleEvents,
  startSpecWatcher,
  cleanupRunner,
} = useEventManager()

// watch active spec, and re-run if it changes!
startSpecWatcher()

onMounted(() => {
  initializeRunnerLifecycleEvents()
})

onBeforeUnmount(() => {
  cleanupRunner()
})

</script>

<route>
{
  name: "Runner"
}
</route>

<style scoped lang="scss">
@import "./spec-runner-scoped.scss";
</style>
