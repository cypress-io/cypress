<template>
  <span
    class="rounded cursor-default border-gray-100 border text-sm text-center grid-flow-col grid px-[8px] leading-[22px] gap-[4px] items-center justify-between select-none"
    :class="classes"
  >
    <i-cy-dot-outline-small
      class="h-[8px] w-[8px]"
      :class="classes"
    />
    <slot />
  </span>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

export type StatusIndicatorType = 'success' | 'warning' | 'error' | 'disabled'

const typeClasses: Record<StatusIndicatorType, string> = {
  success: 'text-jade-500 icon-light-jade-500 icon-dark-jade-500 font-medium',
  error: 'text-red-500 icon-light-red-500 icon-dark-red-500',
  warning: 'text-warning-500 icon-light-warning-500 icon-dark-warning-500',
  disabled: 'text-gray-500 icon-light-gray-50 icon-dark-gray-200',
}

const props = defineProps<{
  type: StatusIndicatorType
}>()

const classes = computed(() => props.type ? typeClasses[props.type] : [])
</script>
