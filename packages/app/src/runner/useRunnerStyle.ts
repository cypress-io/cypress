import { useWindowSize } from '@vueuse/core'
import { computed, ref } from 'vue'
import { usePreferences } from '../composables/usePreferences'
import { useAutStore } from '../store'
import { useScreenshotStore } from '../store/screenshot-store'
import { runnerConstants } from './runner-constants'

export type ResizablePanelName = 'panel1' | 'panel2' | 'panel3'

export type DraggablePanel = Exclude<ResizablePanelName, 'panel3'>

const autMargin = 16
const collapsedNavBarWidth = 64

const reporterWidth = ref<number>(0)
const specListWidth = ref<number>(0)

interface UseRunnerUI {
  initialSpecsListWidth: number
  initialReporterWidth: number
}

export const useRunnerStyle = ({
  initialReporterWidth,
  initialSpecsListWidth,
}: UseRunnerUI = {
  initialReporterWidth: runnerConstants.defaultReporterWidth,
  initialSpecsListWidth: runnerConstants.defaultSpecListWidth,
}) => {
  reporterWidth.value = initialReporterWidth
  specListWidth.value = initialSpecsListWidth

  const { width: windowWidth, height: windowHeight } = useWindowSize()

  const containerWidth = computed(() => {
    const miscBorders = 4
    let nonAutWidth = reporterWidth.value + specListWidth.value + (autMargin * 2) + miscBorders

    if (window.__CYPRESS_MODE__ !== 'run') {
      nonAutWidth += collapsedNavBarWidth
    }

    return windowWidth.value - nonAutWidth
  })

  const containerHeight = computed(() => {
    // TODO: in UNIFY-595 the header's contents will be finalized
    // at narrow widths content will start to wrap
    const autHeaderHeight = 70

    const nonAutHeight = autHeaderHeight + (autMargin * 2)

    return windowHeight.value - nonAutHeight
  })

  const screenshotStore = useScreenshotStore()
  const autStore = useAutStore()

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

  return {
    viewportStyle,
    reporterWidth,
    specListWidth,
    containerHeight,
    containerWidth,
    windowWidth: computed(() => {
      if (window.__CYPRESS_MODE__ === 'run') {
        return windowWidth.value
      }

      return windowWidth.value - collapsedNavBarWidth
    }),
  }
}

export function useResizablePanels () {
  const preferences = usePreferences()

  const handleResizeEnd = (panel: DraggablePanel) => {
    if (panel === 'panel1') {
      preferences.update('specListWidth', specListWidth.value)
    } else {
      preferences.update('reporterWidth', reporterWidth.value)
    }
  }

  const handlePanelWidthUpdated = ({ panel, width }: { panel: DraggablePanel, width: number }) => {
    if (panel === 'panel1') {
      specListWidth.value = width
    } else {
      reporterWidth.value = width
    }
  }

  return {
    handlePanelWidthUpdated,
    handleResizeEnd,
  }
}
