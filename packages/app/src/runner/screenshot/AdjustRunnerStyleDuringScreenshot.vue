<template>
  <div
    :style="style"
    :class="screenshotStore.isScreenshotting || isRunMode ? '' : 'border-l-1'"
  >
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useScreenshotStore } from '../../store'
import { runnerConstants } from '../runner-constants'

const screenshotStore = useScreenshotStore()
const isRunMode = window.__CYPRESS_MODE__ === 'run'

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
