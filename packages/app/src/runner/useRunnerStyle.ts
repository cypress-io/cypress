import { isRunMode } from '@packages/frontend-shared/src/utils/isRunMode'
import { useWindowSize } from '@vueuse/core'
import { computed, ref, watchEffect } from 'vue'
import { usePreferences } from '../composables/usePreferences'
import { useAutStore, useRunnerUiStore } from '../store'
import { useScreenshotStore } from '../store/screenshot-store'
import { runnerConstants } from './runner-constants'

export type ResizablePanelName = 'panel1' | 'panel2' | 'panel3' | 'panel4'

export type DraggablePanel = Exclude<ResizablePanelName, 'panel3'>

const { collapsedNavBarWidth } = runnerConstants
const autMargin = 16

// using local state to track the widths during active resizing,
// so that we only save to GQL when the resizing has ended
const reporterWidth = ref<number>(0)
const specListWidth = ref<number>(0)
const studioWidth = ref<number>(0)

export const useRunnerStyle = () => {
  const { width: windowWidth, height: windowHeight } = useWindowSize()

  // using the runner store for initial values, it will take care of setting defaults if needed
  const runnerUIStore = useRunnerUiStore()
  const screenshotStore = useScreenshotStore()
  const autStore = useAutStore()

  const { reporterWidth: initialReporterWidth, specListWidth: initialSpecsListWidth, studioWidth: initialStudioWidth } = runnerUIStore

  reporterWidth.value = initialReporterWidth
  specListWidth.value = initialSpecsListWidth
  studioWidth.value = initialStudioWidth

  const containerWidth = computed(() => {
    const miscBorders = 4
    const containerMinimum = 50

    let nonAutWidth = 0

    if (!isRunMode) {
      nonAutWidth += collapsedNavBarWidth
    }

    if (!window.__CYPRESS_CONFIG__.hideCommandLog) {
      // if we are not hiding the entire runner, the margins need to be added in
      if (!window.__CYPRESS_CONFIG__.hideRunnerUi) {
        nonAutWidth += (autMargin * 2)
      }

      nonAutWidth += reporterWidth.value + specListWidth.value + studioWidth.value + miscBorders
    }

    const containerWidth = windowWidth.value - nonAutWidth

    const newContainerWidth = containerWidth < containerMinimum ? containerMinimum : containerWidth

    return newContainerWidth
  })

  const containerHeight = computed(() => {
    // if the entire runner is being hidden, there is not non-aut height, otherwise we need to account for the header and margins
    const nonAutHeight = window.__CYPRESS_CONFIG__.hideRunnerUi ? 0 : autStore.specRunnerHeaderHeight + (autMargin * 2)

    return windowHeight.value - nonAutHeight
  })
  const scale = computed(() => {
    let scale = 1

    if (!screenshotStore.isScreenshotting) {
      scale = Math.min(containerWidth.value / autStore.viewportDimensions.width, containerHeight.value / autStore.viewportDimensions.height, 1)
    }

    return scale
  })

  const viewportStyle = computed(() => {
    // in the below styles, `position: absolute` is required to avoid certain edge cases
    // that can happen with overflow (mainly, in Firefox, but not always)
    // see this issue for details: https://github.com/cypress-io/cypress/issues/21881

    let style = `
    width: ${autStore.viewportDimensions.width}px;
    height: ${autStore.viewportDimensions.height}px;
    transform: scale(${scale.value});
    position: absolute;
    `

    // to keep the AUT iframe centered during scaling, we need to calculate the difference between
    // viewport with midpoint and the the container width midpoint and apply a negative margin
    if (!screenshotStore.isScreenshotting) {
      style += `
      margin-left: ${(containerWidth.value / 2) - (autStore.viewportDimensions.width / 2) }px`
    }

    return style
  })

  watchEffect(() => {
    autStore.setScale(scale.value)
  })

  return {
    viewportStyle,
    windowWidth: computed(() => {
      if (isRunMode) {
        return windowWidth.value
      }

      return windowWidth.value - collapsedNavBarWidth
    }),
  }
}

export function useResizablePanels () {
  const preferences = usePreferences()

  const handleResizeEnd = async (panel: DraggablePanel) => {
    if (panel === 'panel1') {
      await preferences.update('specListWidth', specListWidth.value)
    } else if (panel === 'panel4') {
      await preferences.update('studioWidth', studioWidth.value)
    } else {
      await preferences.update('reporterWidth', reporterWidth.value)
    }
  }

  const handlePanelWidthUpdated = ({ panel, width }: { panel: DraggablePanel, width: number }) => {
    if (panel === 'panel1') {
      specListWidth.value = width
    } else if (panel === 'panel4') {
      studioWidth.value = width
    } else {
      reporterWidth.value = width
    }
  }

  return {
    handlePanelWidthUpdated,
    handleResizeEnd,
  }
}
