<template>
  <code
    class="rounded p-[2px]"
    :class="color"
  >
    <slot />
  </code>
</template>
<script lang="ts" setup>
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  variant?: 'default' | 'error'
}>(), { variant: 'default' })

const colorClasses = {
  default: 'bg-purple-100 text-purple-600',
  error: 'bg-red-200 text-red-700',
}

const color = computed(() => {
  return colorClasses[props.variant]
})
</script>
