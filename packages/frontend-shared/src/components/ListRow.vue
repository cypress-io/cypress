<script setup lang="ts">
import { useSlots } from 'vue'

const slots = useSlots()
const emit = defineEmits(['click'])

</script>
<template>
  <div class="border border-gray-200 rounded mb-4 cursor-pointer overflow-hidden">
    <div
      class="py-3 flex cursor-pointer"
      @click="emit('click')"
    >
      <div class="px-5 border-r border-r-gray-200 flex items-center">
        <slot name="icon" />
      </div>
      <div class="px-3 flex-grow">
        <p class="text-indigo-700 whitespace-nowrap">
          <slot name="header" />
        </p>
        <p class="text-gray-500 text-sm">
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
