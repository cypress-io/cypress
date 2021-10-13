<script setup lang="ts">
import { useSlots } from 'vue'

const slots = useSlots()
const emit = defineEmits(['click'])

</script>
<template>
  <div class="mb-4 overflow-hidden border border-gray-100 rounded bg-light-50">
    <button
      class="flex items-center w-full text-left py-10px"
      @click="emit('click')"
    >
      <div class="flex items-center h-10 px-5 border-r border-r-gray-100">
        <slot name="icon" />
      </div>
      <div class="flex-grow px-3 min-h-10">
        <p class="text-indigo-500 whitespace-nowrap min-h-6">
          <slot name="header" />
        </p>
        <p class="text-sm font-light text-gray-500">
          <slot name="description" />
        </p>
      </div>
      <div
        v-if="slots.right"
        class="flex items-center px-4"
      >
        <slot name="right" />
      </div>
    </button>
    <slot name="slider" />
  </div>
</template>
