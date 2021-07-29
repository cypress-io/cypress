<template>
  <span class="border-cool-gray-300 grid-flow-col grid
  items-center justify-between gap-6px
    rounded-sm
    border-1
    text-sm
    text-center
    w-min
    cursor-default
    select-none
    px-8px" :class="classes">
    <i-mdi-circle class="h-8px w-8px" :class="classes"/>
    <slot/></span>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue'

export type StatusIndicatorType = 'success' | 'warning' | 'error' | 'disabled'
const typeClasses: Record<StatusIndicatorType, string> = {
  success: 'text-green-600',
  error: 'text-red-600',
  warning: 'text-amber-600',
  disabled: 'text-cool-gray-400'
}

export default defineComponent({
  props: {
    type: {
      type: String as PropType<StatusIndicatorType>,
    }
  },
  setup(props) {
    return {
      classes: computed(() => props.type ? typeClasses[props.type] : [])
    }
  },
})
</script>
