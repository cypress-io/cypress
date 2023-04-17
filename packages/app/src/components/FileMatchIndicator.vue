<template>
  <div
    class="inline-flex items-center"
    data-cy="file-match-indicator"
  >
    <span
      class="rounded font-medium  h-[24px] text-center px-[8px]  truncate select-none"
      :class="color"
    >
      <slot /></span>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  variant?: 'default' | 'info'
}>(), { variant: 'default' })

const colorClasses = {
  default: 'bg-jade-100 text-jade-600',
  info: 'bg-purple-100 text-purple-600',
}

const color = computed(() => {
  return colorClasses[props.variant]
})
</script>
