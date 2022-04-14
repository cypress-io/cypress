<template>
  <div :style="style">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useScreenshotStore } from '../../store/screenshot-store'

const navbarWidth = 64
const screenshotStore = useScreenshotStore()

const style = computed(() => {
  if (screenshotStore.isScreenshotting) {
    return {
      left: `0px`,
      width: `100%`,
    }
  }

  return {
    width: `calc(100% - ${navbarWidth})`,
  }
})
</script>
