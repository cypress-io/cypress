<template>
  <AdjustRunnerStyleDuringScreenshot
    id="main-pane"
    class="flex"
  >
    <AutomationElement />
    <AutomationDisconnected
      v-if="runnerUiStore.automationStatus === 'DISCONNECTED'"
    />
    <AutomationMissing
      v-else-if="runnerUiStore.automationStatus === 'MISSING'"
    />
    <ResizablePanels
      v-else
      class="w-full"
      :max-total-width="windowWidth"
      :initial-panel1-width="0"
      :initial-panel2-width="runnerUiStore.reporterWidth"
      :show-panel1="false"
      :show-panel2="!screenshotStore.isScreenshotting && !hideCommandLog"
      @resize-end="handleResizeEnd"
      @panel-width-updated="handlePanelWidthUpdated"
    >
      <template #panel2>
        <HideDuringScreenshot
          class="h-full"
        >
          <div
            v-if="!hideCommandLog"
            v-once
            :id="REPORTER_ID"
            class="w-full force-dark"
          />
        </HideDuringScreenshot>
      </template>
      <template #panel3>
        <HideDuringScreenshot>
          <SpecRunnerHeaderRunMode
            v-if="!hideRunnerUi"
            :event-manager="eventManager"
            :get-aut-iframe="getAutIframeModel"
            class="bg-white"
          />
        </HideDuringScreenshot>
        <RemoveClassesDuringScreenshotting
          :class="(hideRunnerUi) ? '' : 'h-0 p-[16px]'"
        >
          <ScriptError
            v-if="autStore.scriptError"
            :error="autStore.scriptError.error"
          />
          <div
            v-show="!autStore.scriptError"
            :id="RUNNER_ID"
            class="origin-top viewport"
            :style="viewportStyle"
          />
        </RemoveClassesDuringScreenshotting>
        <SnapshotControls
          :event-manager="eventManager"
          :get-aut-iframe="getAutIframeModel"
        />
        <ScreenshotHelperPixels />
      </template>
    </ResizablePanels>
  </AdjustRunnerStyleDuringScreenshot>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted } from 'vue'
import { REPORTER_ID, RUNNER_ID } from './utils'
import { getAutIframeModel, getEventManager } from '.'
import { useAutStore, useRunnerUiStore } from '../store'
import SnapshotControls from './SnapshotControls.vue'
import HideDuringScreenshot from './screenshot/HideDuringScreenshot.vue'
import RemoveClassesDuringScreenshotting from './screenshot/RemoveClassesDuringScreenshotting.vue'
import AdjustRunnerStyleDuringScreenshot from './screenshot/AdjustRunnerStyleDuringScreenshot.vue'
import ScreenshotHelperPixels from './screenshot/ScreenshotHelperPixels.vue'
import { useScreenshotStore } from '../store/screenshot-store'
import ScriptError from './ScriptError.vue'
import ResizablePanels from './ResizablePanels.vue'
import AutomationElement from './automation/AutomationElement.vue'
import { useResizablePanels, useRunnerStyle } from './useRunnerStyle'
import { useEventManager } from './useEventManager'
import SpecRunnerHeaderRunMode from './SpecRunnerHeaderRunMode.vue'
import AutomationDisconnected from './automation/AutomationDisconnected.vue'
import AutomationMissing from './automation/AutomationMissing.vue'

const eventManager = getEventManager()

const autStore = useAutStore()
const screenshotStore = useScreenshotStore()
const runnerUiStore = useRunnerUiStore()

const {
  viewportStyle,
  windowWidth,
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

const hideCommandLog = runnerUiStore.hideCommandLog
const hideRunnerUi = runnerUiStore.hideRunnerUi

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
