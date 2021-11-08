<template>
  <div
    :class="classes"
    class="p-0 m-0"
  >
    <slot />
  </div>
</template>

<script lang="ts">
export default defineComponent({
  inheritAttrs: true,
})
</script>

<script lang="ts" setup>
import { computed, defineComponent } from 'vue'
import { useScreenshotStore } from '../../store/screenshot-store'

const screenshotStore = useScreenshotStore()

const classes = computed(() => {
  return {
    'hidden': screenshotStore.isScreenshotting,
  }
})
</script>
