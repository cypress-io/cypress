<template>
  <button
    :id="name"
    class="rounded-50px relative focus:outline-transparent"
    :class="[value ? 'bg-jade-400' : 'bg-gray-300', sizeClasses[size].container]"
    role="switch"
    :aria-checked="value"
    @click="$emit('update', !value)"
  >
    <span
      class="block toggle transform rounded-50px bg-white transition-transform duration-200 ease-out"
      :class="[value ? sizeClasses[size].translate : '', sizeClasses[size].indicator]"
    />
  </button>
</template>

<script lang="ts" setup>

import { computed } from 'vue'

const props = withDefaults(defineProps<{
  value: boolean
  size?: 's' | 'm' | 'l' | 'xl',
  name: string // required for an id so that an external <label> can be associated with the switch
}>(), {
  value: false,
  size: 'l',
})

const sizeClasses = {
  's': {
    container: 'w-16px h-10px',
    indicator: 'w-6px h-6px ml-2px',
    translate: 'translate-x-6px',
  },
  'm': {
    container: 'w-24px h-12px',
    indicator: 'w-8px h-8px ml-2px',
    translate: 'translate-x-12px',
  },
  'l': {
    container: 'w-32px h-16px',
    indicator: 'w-12px h-12px ml-2px',
    translate: 'translate-x-16px',
  },
  'xl': {
    container: 'w-48px h-24px',
    indicator: 'w-16px h-16px ml-4px',
    translate: 'translate-x-24px',
  },
}

defineEmits(['update'])
</script>
