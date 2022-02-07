<template>
  <div
    class="relative"
    @click="start()"
  >
    <slot />
    <div
      ref="tooltip"
      class="rounded flex bg-gray-900 text-center opacity-0 p-8px transform transition-opacity top-0 left-[50%] text-gray-300 translate-y-[calc(-100%-4px)] translate-x-[-50%] duration-250 absolute pointer-events-none"
      role="tooltip"
      :class="[tooltipClass, {'opacity-100': isPending}]"
    >
      <slot name="popper" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useTimeoutFn } from '@vueuse/core'
import { computed, ref } from 'vue'

const tooltip = ref<HTMLDivElement>()

const tooltipClass = computed(() => {
  if (!tooltip.value) return ''

  const { right } = tooltip.value.getBoundingClientRect()
  const outerWidth = window.outerWidth

  return (right > outerWidth) ? 'tooltip-overflow' : ''
})

const { start, isPending } = useTimeoutFn(() => {}, 2000, { immediate: false })

</script>

<style scoped>
/* Created a class to override !important via greater specificity */
div.tooltip-overflow {
  @apply left-auto right-0 translate-x-0
}
</style>
