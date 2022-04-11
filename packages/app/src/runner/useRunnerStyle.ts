import { useWindowSize } from '@vueuse/core'
import { computed, ref, watchEffect } from 'vue'
import { usePreferences } from '../composables/usePreferences'
import { useAutStore, useRunnerUiStore } from '../store'
import { useScreenshotStore } from '../store/screenshot-store'

export type ResizablePanelName = 'panel1' | 'panel2' | 'panel3'

export type DraggablePanel = Exclude<ResizablePanelName, 'panel3'>

const autMargin = 16
const collapsedNavBarWidth = 64

const reporterWidth = ref<number>(0)
const specListWidth = ref<number>(0)

export const useRunnerStyle = () => {
  const { width: windowWidth, height: windowHeight } = useWindowSize()

  // using the runner store for initial values, it will take care of setting defaults if needed
  const { isSpecsListOpen, reporterWidth: uiStoreReporterWidth, specListWidth: uiStoreSpecListWidth } = useRunnerUiStore()

  reporterWidth.value = uiStoreReporterWidth
  specListWidth.value = uiStoreSpecListWidth

  const containerWidth = computed(() => {
    const miscBorders = 4
    let nonAutWidth = reporterWidth.value + (isSpecsListOpen ? specListWidth.value : 0) + (autMargin * 2) + miscBorders

    if (window.__CYPRESS_MODE__ !== 'run') {
      nonAutWidth += collapsedNavBarWidth
    }

    return windowWidth.value - nonAutWidth
  })

  const screenshotStore = useScreenshotStore()
  const autStore = useAutStore()

  const containerHeight = computed(() => {
    const nonAutHeight = autStore.specRunnerHeaderHeight + (autMargin * 2)

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
    return `
      width: ${autStore.viewportDimensions.width}px;
      height: ${autStore.viewportDimensions.height}px;
      transform: scale(${scale.value});
      margin-left: ${(containerWidth.value / 2) - (autStore.viewportDimensions.width / 2) }px`
  })

  watchEffect(() => {
    autStore.setScale(scale.value)
  })

  return {
    viewportStyle,
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
