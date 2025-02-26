<template>
  <StudioInstructionsModal
    :open="studioStore.instructionModalIsOpen"
    @close="studioStore.closeInstructionModal"
  />
  <StudioSaveModal
    :open="studioStore.saveModalIsOpen"
    @close="studioStore.closeSaveModal"
  />
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
      :gql="props.gql.currentProject"
    />
    <ResizablePanels
      v-else
      :style="{width: `calc(100vw - ${screenshotStore.isScreenshotting ? 0 : collapsedNavBarWidth}px)`}"
      :offset-left="collapsedNavBarWidth"
      :max-total-width="windowWidth - collapsedNavBarWidth"
      :initial-panel1-width="specsListWidthPreferences"
      :initial-panel2-width="reporterWidthPreferences"
      :min-panel1-width="minWidths.specsList"
      :min-panel2-width="minWidths.reporter"
      :min-panel3-width="minWidths.aut"
      :show-panel1="runnerUiStore.isSpecsListOpen && !screenshotStore.isScreenshotting"
      :show-panel2="!screenshotStore.isScreenshotting && !hideCommandLog"
      :show-panel4="shouldShowStudioPanel"
      @resize-end="handleResizeEnd"
      @panel-width-updated="handlePanelWidthUpdated"
    >
      <template #panel1="{isDragging}">
        <HideDuringScreenshot
          v-if="props.gql.currentProject"
          v-show="runnerUiStore.isSpecsListOpen"
          id="inline-spec-list"
          class="h-full bg-gray-1000 border-gray-900 border-r force-dark"
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
            v-if="!hideCommandLog"
            v-once
            :id="REPORTER_ID"
            class="w-full force-dark"
          />
        </HideDuringScreenshot>
      </template>
      <template #panel3>
        <HideDuringScreenshot class="bg-white">
          <SpecRunnerHeaderOpenMode
            v-if="props.gql.currentProject"
            :gql="props.gql.currentProject"
            :event-manager="eventManager"
            :get-aut-iframe="getAutIframeModel"
          />
        </HideDuringScreenshot>

        <RemoveClassesDuringScreenshotting
          class="h-0 p-[16px]"
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
      <template #panel4>
        <StudioPanel v-show="shouldShowStudioPanel" />
      </template>
    </ResizablePanels>
  </AdjustRunnerStyleDuringScreenshot>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { REPORTER_ID, RUNNER_ID } from './utils'
import InlineSpecList from '../specs/InlineSpecList.vue'
import { getAutIframeModel, getEventManager } from '.'
import { useAutStore, useRunnerUiStore } from '../store'
import type { FileDetails } from '@packages/types'
import SnapshotControls from './SnapshotControls.vue'
import SpecRunnerHeaderOpenMode from './SpecRunnerHeaderOpenMode.vue'
import HideDuringScreenshot from './screenshot/HideDuringScreenshot.vue'
import RemoveClassesDuringScreenshotting from './screenshot/RemoveClassesDuringScreenshotting.vue'
import AdjustRunnerStyleDuringScreenshot from './screenshot/AdjustRunnerStyleDuringScreenshot.vue'
import ScreenshotHelperPixels from './screenshot/ScreenshotHelperPixels.vue'
import { useScreenshotStore } from '../store/screenshot-store'
import ChooseExternalEditorModal from '@packages/frontend-shared/src/gql-components/ChooseExternalEditorModal.vue'
import { useMutation, gql } from '@urql/vue'
import { SpecRunnerOpenMode_OpenFileInIdeDocument } from '../generated/graphql'
import type { SpecRunnerFragment } from '../generated/graphql'
import { usePreferences } from '../composables/usePreferences'
import ScriptError from './ScriptError.vue'
import ResizablePanels from './ResizablePanels.vue'
import AutomationElement from './automation/AutomationElement.vue'
import { useResizablePanels, useRunnerStyle } from './useRunnerStyle'
import { useEventManager } from './useEventManager'
import AutomationDisconnected from './automation/AutomationDisconnected.vue'
import AutomationMissing from './automation/AutomationMissing.vue'
import { runnerConstants } from './runner-constants'
import StudioInstructionsModal from './studio/StudioInstructionsModal.vue'
import StudioSaveModal from './studio/StudioSaveModal.vue'
import { useStudioStore } from '../store/studio-store'
import StudioPanel from '../studio/StudioPanel.vue'

const {
  preferredMinimumPanelWidth,
  absoluteAutMinimum,
  absoluteSpecListMinimum,
  absoluteReporterMinimum,
  collapsedNavBarWidth,
} = runnerConstants

gql`
fragment SpecRunner_Preferences on Query {
  localSettings {
    preferences {
      isSideNavigationOpen
      isSpecsListOpen
      autoScrollingEnabled
      reporterWidth
      specListWidth
      studioWidth
    }
  }
}
`

gql`
fragment SpecRunner_Studio on Query {
  studio {
    status
  }
}
`

gql`
fragment SpecRunner_Config on CurrentProject {
  id
  config
}
`

gql`
fragment SpecRunner on Query {
  ...Specs_InlineSpecList
  currentProject {
    id
    ...SpecRunner_Config
    ...SpecRunnerHeader
    ...AutomationMissing
  }
  ...ChooseExternalEditor
  ...SpecRunner_Preferences
  ...SpecRunner_Studio
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
  handlePanelWidthUpdated,
  handleResizeEnd,
} = useResizablePanels()

const {
  initializeRunnerLifecycleEvents,
  startSpecWatcher,
  cleanupRunner,
} = useEventManager()

const studioStore = useStudioStore()

const specsListWidthPreferences = computed(() => {
  return props.gql.localSettings.preferences.specListWidth ?? runnerUiStore.specListWidth
})

const reporterWidthPreferences = computed(() => {
  return props.gql.localSettings.preferences.reporterWidth ?? runnerUiStore.reporterWidth
})

const studioWidthPreferences = computed(() => {
  return props.gql.localSettings.preferences.studioWidth ?? runnerUiStore.studioWidth
})

const isSpecsListOpenPreferences = computed(() => {
  return props.gql.localSettings.preferences.isSpecsListOpen ?? false
})

const studioStatus = computed(() => {
  return props.gql.studio?.status
})

const shouldShowStudioPanel = computed(() => {
  return studioStatus.value === 'INITIALIZED' && studioStore.isActive
})

const hideCommandLog = runnerUiStore.hideCommandLog

// watch active spec, and re-run if it changes!
startSpecWatcher()

onMounted(() => {
  initializeRunnerLifecycleEvents()
})

preferences.update('autoScrollingEnabled', props.gql.localSettings.preferences.autoScrollingEnabled ?? true)

// if the CYPRESS_NO_COMMAND_LOG environment variable is set,
// don't use the widths or the open status of specs list from GraphQL
if (!hideCommandLog) {
  preferences.update('isSpecsListOpen', isSpecsListOpenPreferences.value)
  preferences.update('reporterWidth', reporterWidthPreferences.value)
  preferences.update('specListWidth', specsListWidthPreferences.value)
  preferences.update('studioWidth', studioWidthPreferences.value)
  // 👆 we must update these preferences before calling useRunnerStyle, to make sure that values from GQL
  // will be available during the initial calculation that useRunnerStyle does
}

const {
  viewportStyle,
  windowWidth,
} = useRunnerStyle()

function getMinimum (absoluteMinimum: number, doesContentFit: boolean) {
  // windowWidth.value / 6 is arbitrary here, it just happens to work nicely to give us
  // some flexibility in proportion to the window
  return doesContentFit ? Math.min(absoluteMinimum, windowWidth.value / 6) : preferredMinimumPanelWidth
}

const minWidths = computed(() => {
  let smallestIdealWindowSize = preferredMinimumPanelWidth * 2 + collapsedNavBarWidth
  let contentWidth = reporterWidthPreferences.value + collapsedNavBarWidth + preferredMinimumPanelWidth

  if (isSpecsListOpenPreferences.value) {
    contentWidth += specsListWidthPreferences.value
    smallestIdealWindowSize += preferredMinimumPanelWidth
  }

  const isWindowTooSmall = windowWidth.value < smallestIdealWindowSize
  const doesContentFit = contentWidth > windowWidth.value || isWindowTooSmall

  return {
    aut: getMinimum(absoluteAutMinimum, doesContentFit),
    specsList: getMinimum(absoluteSpecListMinimum, doesContentFit),
    reporter: getMinimum(absoluteReporterMinimum, doesContentFit),
  }
})

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
