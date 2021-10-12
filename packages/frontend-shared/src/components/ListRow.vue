<script setup lang="ts">
import { useSlots } from 'vue'

const slots = useSlots()
const emit = defineEmits(['click'])

</script>
<template>
  <div class="border border-gray-100 rounded mb-4 cursor-pointer overflow-hidden">
    <div
      class="py-3 flex cursor-pointer"
      @click="emit('click')"
    >
      <div class="px-5 border-r border-r-gray-100 flex items-center min-h-10">
        <slot name="icon" />
      </div>
      <div class="px-3 flex-grow min-h-10">
        <p class="text-indigo-500 whitespace-nowrap min-h-6">
          <slot name="header" />
        </p>
        <p class="text-gray-500 text-sm font-light">
          <slot name="description" />
        </p>
      </div>
      <div
        v-if="slots.slider"
        class="px-4 flex items-center"
      >
        <i-cy-dropcaret />
      </div>
    </div>
    <slot name="slider" />
  </div>
</template>
