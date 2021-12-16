<template>
  <RemovePositioningDuringScreenshot
    id="main-pane"
    class="flex border-gray-900 border-l-1"
  >
    <ResizablePanels
      :offset-left="64"
      :max-total-width="windowWidth - 64"
      :initial-panel1-width="initialSpecsListWidth"
      :initial-panel2-width="initialReporterWidth"
      :show-panel1="runnerUiStore.isSpecsListOpen && !screenshotStore.isScreenshotting"
      :show-panel2="!screenshotStore.isScreenshotting"
      @resize-end="handleResizeEnd"
      @panel-width-updated="handlePanelWidthUpdated"
    >
      <template #panel1="{isDragging}">
        <HideDuringScreenshot
          v-if="props.gql.currentProject"
          v-show="runnerUiStore.isSpecsListOpen"
          id="inline-spec-list"
          class="h-full bg-gray-1000"
          :class="{'pointer-events-none': isDragging}"
        >
          <InlineSpecList
            id="reporter-inline-specs-list"
            :gql="props.gql"
          />
          <ChooseExternalEditorModal
            :open="runnerUiStore.showChooseExternalEditorModal"
            :gql="props.gql"
            @close="runnerUiStore.setShowChooseExternalEditorModal(false)"
            @selected="openFile"
          />
        </HideDuringScreenshot>
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
      <template
        #panel3
      >
        <HideDuringScreenshot class="bg-white p-16px">
          <SpecRunnerHeader
            v-if="props.gql.currentProject"
            :gql="props.gql.currentProject"
            :event-manager="eventManager"
            :get-aut-iframe="getAutIframeModel"
          />
        </HideDuringScreenshot>

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
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { REPORTER_ID, RUNNER_ID, getRunnerElement, getReporterElement, empty } from '../runner/utils'
import InlineSpecList from '../specs/InlineSpecList.vue'
import { getAutIframeModel, getEventManager, UnifiedRunnerAPI } from '../runner'
import { useAutStore, useRunnerUiStore } from '../store'
import type { BaseSpec, FileDetails } from '@packages/types'
import SnapshotControls from './SnapshotControls.vue'
import SpecRunnerHeader from './SpecRunnerHeader.vue'
import HideDuringScreenshot from './screenshot/HideDuringScreenshot.vue'
import RemoveClassesDuringScreenshotting from './screenshot/RemoveClassesDuringScreenshotting.vue'
import RemovePositioningDuringScreenshot from './screenshot/RemovePositioningDuringScreenshot.vue'
import ScreenshotHelperPixels from './screenshot/ScreenshotHelperPixels.vue'
import { useScreenshotStore } from '../store/screenshot-store'
import ChooseExternalEditorModal from '@packages/frontend-shared/src/gql-components/ChooseExternalEditorModal.vue'
import { useMutation, gql } from '@urql/vue'
import { OpenFileInIdeDocument } from '@packages/data-context/src/gen/all-operations.gen'
import type { SpecRunnerFragment } from '../generated/graphql'
import { usePreferences } from '../composables/usePreferences'
import ScriptError from './ScriptError.vue'
import { useWindowSize } from '@vueuse/core'
import ResizablePanels, { DraggablePanel } from './ResizablePanels.vue'
import { runnerConstants } from './runner-constants'

const { height: windowHeight, width: windowWidth } = useWindowSize()

gql`
fragment SpecRunner on Query {
  ...Specs_InlineSpecList
  currentProject {
    id
    ...SpecRunnerHeader
  }
  ...ChooseExternalEditor
  localSettings {
    preferences {
      isSpecsListOpen
      autoScrollingEnabled
      reporterWidth
      specListWidth
    }
  }
}
`

gql`
mutation OpenFileInIDE ($input: FileDetailsInput!) {
  openFileInIDE (input: $input)
}
`

const props = defineProps<{
  gql: SpecRunnerFragment
  activeSpec: BaseSpec
}>()

const eventManager = getEventManager()

const autStore = useAutStore()
const screenshotStore = useScreenshotStore()
const runnerUiStore = useRunnerUiStore()
const preferences = usePreferences()
const initialSpecsListWidth: number = props.gql.localSettings.preferences.specListWidth ?? runnerConstants.defaultSpecListWidth
const initialReporterWidth: number = props.gql.localSettings.preferences.reporterWidth ?? runnerConstants.defaultReporterWidth
const reporterWidth = ref(initialReporterWidth)
const specListWidth = ref(initialSpecsListWidth)

// Todo: maybe `update` should take an object, not just a key-value pair and do updates like this all in one batch
preferences.update('autoScrollingEnabled', props.gql.localSettings.preferences.autoScrollingEnabled ?? true)
preferences.update('isSpecsListOpen', props.gql.localSettings.preferences.isSpecsListOpen ?? true)
preferences.update('reporterWidth', initialReporterWidth)
preferences.update('specListWidth', initialSpecsListWidth)

const autMargin = 16
const collapsedNavBarWidth = 64

const containerWidth = computed(() => {
  const miscBorders = 4
  const nonAutWidth = reporterWidth.value + specListWidth.value + (autMargin * 2) + miscBorders + collapsedNavBarWidth

  return windowWidth.value - nonAutWidth
})

const containerHeight = computed(() => {
  // TODO: in UNIFY-595 the header's contents will be finalized
  // at narrow widths content will start to wrap
  const autHeaderHeight = 70

  const nonAutHeight = autHeaderHeight + (autMargin * 2)

  return windowHeight.value - nonAutHeight
})

const handleResizeEnd = (panel: DraggablePanel) => {
  if (panel === 'panel1') {
    preferences.update('specListWidth', specListWidth.value)
  } else {
    preferences.update('reporterWidth', reporterWidth.value)
  }
}

const handlePanelWidthUpdated = ({ panel, width }) => {
  if (panel === 'panel1') {
    specListWidth.value = width
  } else {
    reporterWidth.value = width
  }
}

const viewportStyle = computed(() => {
  let scale: number = 1

  if (!screenshotStore.isScreenshotting) {
    scale = Math.min(containerWidth.value / autStore.viewportDimensions.width, containerHeight.value / autStore.viewportDimensions.height, 1)
  }

  return `
  width: ${autStore.viewportDimensions.width}px;
  height: ${autStore.viewportDimensions.height}px;
  transform: scale(${scale});`
})

function runSpec () {
  autStore.setScriptError(null)
  UnifiedRunnerAPI.executeSpec(props.activeSpec)
}

let fileToOpen: FileDetails

const openFileInIDE = useMutation(OpenFileInIdeDocument)

function openFile () {
  runnerUiStore.setShowChooseExternalEditorModal(false)

  if (!fileToOpen) {
    // should not be possible!
    return
  }

  openFileInIDE.executeMutation({
    input: {
      absolute: fileToOpen.absoluteFile,
      line: fileToOpen.line,
      column: fileToOpen.column,
    },
  })
}

watch(() => props.activeSpec, (spec) => {
  runSpec()
}, { immediate: true, flush: 'post' })

onMounted(() => {
  const eventManager = getEventManager()

  eventManager.on('restart', () => {
    runSpec()
  })

  eventManager.on('open:file', (file) => {
    fileToOpen = file

    if (props.gql.localSettings.preferences.preferredEditorBinary) {
      openFile()
    } else {
      runnerUiStore.setShowChooseExternalEditorModal(true)
    }
  })

  eventManager.on('before:screenshot', (payload) => {
    if (payload.appOnly) {
      screenshotStore.setScreenshotting(true)
    }
  })

  eventManager.on('after:screenshot', () => {
    screenshotStore.setScreenshotting(false)
  })

  eventManager.on('save:app:state', (state) => {
    preferences.update('isSpecsListOpen', state.isSpecsListOpen)
    preferences.update('autoScrollingEnabled', state.autoScrollingEnabled)
  })

  eventManager.on('script:error', (err) => {
    autStore.scriptError = err
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
    Easiest way to reproduce is remove the `position: fixed`
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
  margin: 0 auto;
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
