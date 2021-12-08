<template>
  <RemovePositioningDuringScreenshot
    id="main-pane"
    class="flex border-gray-900 border-l-1"
  >
    <HideDuringScreenshot
      id="inline-spec-list"
      class="bg-gray-1000"
    >
      <template
        v-if="props.gql.currentProject"
      >
        <Vue3DraggableResizable
          v-model:w="specsListWidth"
          :init-w="280"
          :init-h="windowHeight"
          :handles="['mr']"
          :draggable="false"
          class-name-handle="h-full bg-transparent border-transparent top-0 w-8px right-0 block cursor-ew-resize handle"
          class="relative"
        >
          <InlineSpecList
            v-show="runnerUiStore.isSpecsListOpen"
            id="reporter-inline-specs-list"
            :gql="props.gql"
          />
        </Vue3DraggableResizable>
      </template>

      <ChooseExternalEditorModal
        :open="runnerUiStore.showChooseExternalEditorModal"
        :gql="props.gql"
        @close="runnerUiStore.setShowChooseExternalEditorModal(false)"
        @selected="openFile"
      />
    </HideDuringScreenshot>

    <HideDuringScreenshot>
      <Vue3DraggableResizable
        v-model:w="reporterWidth"
        :init-w="320"
        :init-h="windowHeight"
        :handles="['mr']"
        :draggable="false"
        class-name-handle="h-full bg-transparent border-transparent top-0 w-8px right-0 block z-40 cursor-ew-resize handle"
        class="z-30 relative"
      >
        <div
          v-once
          :id="REPORTER_ID"
        />
      </Vue3DraggableResizable>
    </HideDuringScreenshot>

    <div
      ref="runnerPane"
      class="w-full relative"
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
import Vue3DraggableResizable from 'vue3-draggable-resizable'
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

preferences.update('autoScrollingEnabled', props.gql.localSettings.preferences.autoScrollingEnabled ?? true)
preferences.update('isSpecsListOpen', props.gql.localSettings.preferences.isSpecsListOpen ?? true)

const runnerPane = ref<HTMLDivElement>()
const reporterWidth = ref<number>(320)
const specsListWidth = ref<number>(280)

const autMargin = 16

const containerWidth = computed(() => {
  // TODO: make these values dynamic in UNIFY-592:
  const navWidth = 64
  const miscBorders = 4
  const nonAutWidth = reporterWidth.value + navWidth + specsListWidth.value + (autMargin * 2) + miscBorders

  return windowWidth.value - nonAutWidth
})

const containerHeight = computed(() => {
  // TODO: make these values dynamic in UNIFY-592:
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
