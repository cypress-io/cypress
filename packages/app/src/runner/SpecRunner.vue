<template>
  <RemovePositioningDuringScreenshot
    id="main-pane"
    class="flex border-gray-900 border-l-1"
    :class="{'select-none': specsListIsDragging || reporterIsDragging}"
  >
    <HideDuringScreenshot
      id="inline-spec-list"
      class="bg-gray-1000"
    >
      <div
        v-if="props.gql.currentProject"
        v-show="runnerUiStore.isSpecsListOpen"
        class="relative"
        :style="{width: `${specsListWidth - 64}px`}"
      >
        <InlineSpecList
          id="reporter-inline-specs-list"
          :gql="props.gql"
        />
        <div
          v-show="runnerUiStore.isSpecsListOpen"
          ref="specsListResizeHandle"
          class="cursor-ew-resize h-full top-0 -right-6px w-16px z-30 absolute"
        />
      </div>

      <ChooseExternalEditorModal
        :open="runnerUiStore.showChooseExternalEditorModal"
        :gql="props.gql"
        @close="runnerUiStore.setShowChooseExternalEditorModal(false)"
        @selected="openFile"
      />
    </HideDuringScreenshot>

    <HideDuringScreenshot>
      <div
        class="h-full relative"
        :style="{width: `${reporterWidth}px`}"
      >
        <div
          v-once
          :id="REPORTER_ID"
          :class="{'select-none': specsListIsDragging}"
          class="w-full"
        />

        <div
          v-show="runnerUiStore.isSpecsListOpen"
          ref="reporterResizeHandle"
          class="cursor-ew-resize h-full top-0 -right-6px w-16px z-30 absolute"
        />
      </div>
    </HideDuringScreenshot>

    <div
      ref="runnerPane"
      class="w-full relative"
      :class="{'pointer-events-none': specsListIsDragging || reporterIsDragging}"
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
    </div>
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
import { useWindowSize, useDraggable } from '@vueuse/core'

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
      specsListWidth
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
const initialSpecsListWidth: number = props.gql.localSettings.preferences.specsListWidth ?? 280
const initialReporterWidth: number = props.gql.localSettings.preferences.reporterWidth ?? 320

// Todo: maybe `update` should take an object, not just a key-value pair and do updates like this all in one batch
preferences.update('autoScrollingEnabled', props.gql.localSettings.preferences.autoScrollingEnabled ?? true)
preferences.update('isSpecsListOpen', props.gql.localSettings.preferences.isSpecsListOpen ?? true)
preferences.update('reporterWidth', initialReporterWidth)
preferences.update('specsListWidth', initialSpecsListWidth)

const runnerPane = ref<HTMLDivElement>()

const MIN_AUT_WIDTH = 200

const specsListResizeHandle = ref<HTMLElement | null>(null)
const reporterResizeHandle = ref<HTMLElement | null>(null)
const lastReporterWidth = ref(initialReporterWidth)
const lastSpecsListWidth = ref(initialSpecsListWidth)

const { x: specsListHandleX, isDragging: specsListIsDragging } = useDraggable(specsListResizeHandle, {
  initialValue: { x: initialSpecsListWidth, y: 0 },
  exact: true,
  preventDefault: true,
  onMove: () => {
    lastSpecsListWidth.value = specsListWidth.value
  },
  onEnd: () => {
    // console.log('end drag specs list x val', specsListHandleX.value)
    // console.log('end drag specs list width val', specsListWidth.value)
    specsListHandleX.value = specsListWidth.value
    handleResizeEnd('specsList')
  },
})

const { x: reporterHandleX, isDragging: reporterIsDragging } = useDraggable(reporterResizeHandle, {
  initialValue: { x: initialReporterWidth + initialSpecsListWidth, y: 0 },
  exact: true,
  preventDefault: true,
  onMove: () => {
    lastReporterWidth.value = reporterWidth.value
  },
  onEnd: () => {
    reporterHandleX.value = reporterWidth.value + specsListWidth.value
    lastReporterWidth.value = reporterWidth.value
    handleResizeEnd('reporter')
  },
})
const specsListWidth = computed(() => {
  if (!runnerUiStore.isSpecsListOpen) {
    return 0
  }

  if (!specsListIsDragging) {
    return lastSpecsListWidth.value
  }

  const nonSpecsListWidth = reporterWidth.value + MIN_AUT_WIDTH
  const maxSpecsListWidth = windowWidth.value - nonSpecsListWidth

  if (specsListHandleX.value <= maxSpecsListWidth && specsListHandleX.value > 300) {
    return specsListHandleX.value
  }

  if (specsListHandleX.value > maxSpecsListWidth) {
    return maxSpecsListWidth
  }

  return 300
})

const reporterWidth = computed(() => {
  if (!reporterIsDragging.value) {
    // console.log('reporter is not dragging, using last value ', lastReporterWidth.value)

    return lastReporterWidth.value
  }

  const unavailableWidth = specsListWidth.value + MIN_AUT_WIDTH + 50
  const maxReporterWidth = windowWidth.value - unavailableWidth
  const currentReporterWidth = reporterHandleX.value - specsListWidth.value

  if (!maxReporterWidth || !currentReporterWidth) {
    // console.log('missing maxReporterWidth or currentReporterWidth')

    return initialReporterWidth
  }

  if (currentReporterWidth <= maxReporterWidth && currentReporterWidth > 200) {
    // console.log('safe zone, currentReporterWidth was less than maxReporterWidth and greater than 200', currentReporterWidth)

    return currentReporterWidth
  }

  if (currentReporterWidth > maxReporterWidth) {
    // console.log('currentReporterWidth was greater than maxReporterWidth, return max')

    return maxReporterWidth
  }

  if (currentReporterWidth < 200) {
    // console.log('currentReporterWidth less than 200')

    return 200
  }

  // console.log('something else', reporterIsDragging.value, currentReporterWidth, maxReporterWidth)

  return currentReporterWidth
})
const autMargin = 16

const containerWidth = computed(() => {
  const miscBorders = 4
  const nonAutWidth = reporterWidth.value + specsListWidth.value + (autMargin * 2) + miscBorders

  return windowWidth.value - nonAutWidth
})

const containerHeight = computed(() => {
  const autHeaderHeight = 70

  const nonAutHeight = autHeaderHeight + (autMargin * 2)

  return windowHeight.value - nonAutHeight
})

const viewportStyle = computed(() => {
  if (!runnerPane.value) {
    return
  }

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

function handleResizeEnd (pane: 'reporter' | 'specsList') {
  if (pane === 'reporter') {
    preferences.update('reporterWidth', Math.round(reporterWidth.value))
  } else {
    preferences.update('specsListWidth', Math.round(specsListWidth.value))
  }
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
    reporterHandleX.value = state.isSpecsListOpen ? runnerUiStore.specsListWidth : 0
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
