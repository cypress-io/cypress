<template>
  <div :style="style">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { isRunMode } from '@packages/frontend-shared/src/utils/isRunMode'
import { computed } from 'vue'
import { useScreenshotStore } from '../../store'
import { runnerConstants } from '../runner-constants'

const screenshotStore = useScreenshotStore()

const style = computed(() => {
  if (screenshotStore.isScreenshotting) {
    return {
      left: `0px`,
      width: `100%`,
    }
  }

  return {
    // since run mode has no nav, let's check for run mode here
    width: isRunMode ? '100%' : `calc(100% - ${runnerConstants.collapsedNavBarWidth})`,
  }
})
</script>
