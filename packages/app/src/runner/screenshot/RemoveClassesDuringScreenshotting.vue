<template>
  <div
    :class="classes"
  >
    <slot />
  </div>
</template>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false,
})

</script>

<script lang="ts" setup>
import { computed, defineComponent, useAttrs } from 'vue'
import { useScreenshotStore } from '../../store/screenshot-store'

const screenshotStore = useScreenshotStore()
const attrs = useAttrs()

const classes = computed(() => {
  return {
    [attrs.class as string]: !screenshotStore.isScreenshotting,
  }
})
</script>
