<template>
  <RemovePositioningDuringScreenshot
    id="main-pane"
    class="flex border-gray-900 border-l-1"
  >
    <ResizablePanels
      :offset-left="64"
      :max-total-width="windowWidth"
      :initial-panel1-width="specListWidth"
      :initial-panel2-width="reporterWidth"
      :min-panel3-width="340"
      :show-panel1="runnerUiStore.isSpecsListOpen && !screenshotStore.isScreenshotting"
      :show-panel2="!screenshotStore.isScreenshotting"
      @resize-end="handleResizeEnd"
      @panel-width-updated="handlePanelWidthUpdated"
    >
      <template #panel1="{isDragging}">
        <HideDuringScreenshotOrRunMode
          v-if="props.gql.currentProject"
          v-show="runnerUiStore.isSpecsListOpen"
          id="inline-spec-list"
          class="h-full bg-gray-1000 border-gray-900 border-r-1 force-dark"
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
        </HideDuringScreenshotOrRunMode>
      </template>
      <template #panel2>
        <HideDuringScreenshot
          class="h-full"
        >
          <div
            v-once
            :id="REPORTER_ID"
            class="w-full force-dark"
          />
        </HideDuringScreenshot>
      </template>
      <template #panel3="{width}">
        <HideDuringScreenshotOrRunMode class="bg-white">
          <SpecRunnerHeaderOpenMode
            v-if="props.gql.currentProject"
            :gql="props.gql.currentProject"
            :event-manager="eventManager"
            :get-aut-iframe="getAutIframeModel"
            :width="width"
          />
        </HideDuringScreenshotOrRunMode>

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
            TODO: UNIFY-1341 - Figure out bugs in automation lifecycle
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
import InlineSpecList from '../specs/InlineSpecList.vue'
import { getAutIframeModel, getEventManager } from '.'
import { useAutStore, useRunnerUiStore } from '../store'
import type { FileDetails } from '@packages/types'
import SnapshotControls from './SnapshotControls.vue'
import SpecRunnerHeaderOpenMode from './SpecRunnerHeaderOpenMode.vue'
import HideDuringScreenshot from './screenshot/HideDuringScreenshot.vue'
import RemoveClassesDuringScreenshotting from './screenshot/RemoveClassesDuringScreenshotting.vue'
import RemovePositioningDuringScreenshot from './screenshot/RemovePositioningDuringScreenshot.vue'
import ScreenshotHelperPixels from './screenshot/ScreenshotHelperPixels.vue'
import { useScreenshotStore } from '../store/screenshot-store'
import ChooseExternalEditorModal from '@packages/frontend-shared/src/gql-components/ChooseExternalEditorModal.vue'
import { useMutation, gql } from '@urql/vue'
import { SpecRunnerOpenMode_OpenFileInIdeDocument } from '../generated/graphql'
import type { SpecRunnerFragment } from '../generated/graphql'
import { usePreferences } from '../composables/usePreferences'
import ScriptError from './ScriptError.vue'
import ResizablePanels from './ResizablePanels.vue'
import HideDuringScreenshotOrRunMode from './screenshot/HideDuringScreenshotOrRunMode.vue'
import AutomationElement from './automation/AutomationElement.vue'
import { useResizablePanels, useRunnerStyle } from './useRunnerStyle'
import { useEventManager } from './useEventManager'

gql`
fragment SpecRunner_Preferences on Query {
  localSettings {
    preferences {
      isSideNavigationOpen
      isSpecsListOpen
      autoScrollingEnabled
      reporterWidth
      specListWidth
    }
  }
}
`

gql`
fragment SpecRunner on Query {
  ...Specs_InlineSpecList
  currentProject {
    id
    ...SpecRunnerHeader
  }
  ...ChooseExternalEditor
  ...SpecRunner_Preferences
}
`

gql`
mutation SpecRunnerOpenMode_OpenFileInIDE ($input: FileDetailsInput!) {
  openFileInIDE (input: $input)
}
`

const props = defineProps<{
  gql: SpecRunnerFragment
}>()

const eventManager = getEventManager()

const autStore = useAutStore()
const screenshotStore = useScreenshotStore()
const runnerUiStore = useRunnerUiStore()
const preferences = usePreferences()

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

preferences.update('autoScrollingEnabled', props.gql.localSettings.preferences.autoScrollingEnabled ?? true)
preferences.update('isSpecsListOpen', props.gql.localSettings.preferences.isSpecsListOpen ?? true)
preferences.update('reporterWidth', reporterWidth.value)
preferences.update('specListWidth', specListWidth.value)

let fileToOpen: FileDetails

const openFileInIDE = useMutation(SpecRunnerOpenMode_OpenFileInIdeDocument)

function openFile () {
  runnerUiStore.setShowChooseExternalEditorModal(false)

  if (!fileToOpen) {
    // should not be possible!
    return
  }

  openFileInIDE.executeMutation({
    input: {
      filePath: fileToOpen.absoluteFile,
      line: fileToOpen.line,
      column: fileToOpen.column,
    },
  })
}

onMounted(() => {
  const eventManager = getEventManager()

  // these events use GraphQL
  // ideally, we should make these more loosely coupled
  // so we don't need to mix GraphQL and the event manager lifecycle.
  eventManager.on('open:file', (file) => {
    fileToOpen = file

    if (props.gql.localSettings.preferences.preferredEditorBinary) {
      openFile()
    } else {
      runnerUiStore.setShowChooseExternalEditorModal(true)
    }
  })

  eventManager.on('save:app:state', (state) => {
    preferences.update('isSpecsListOpen', state.isSpecsListOpen)
    preferences.update('autoScrollingEnabled', state.autoScrollingEnabled)
  })
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
