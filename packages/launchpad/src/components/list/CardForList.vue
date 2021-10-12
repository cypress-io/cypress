<script setup lang="ts">
/// <reference types="vite-svg-loader" />

import { useSlots } from 'vue'
import IconCaret from '../../icons/dropcaret.svg?component'

const slots = useSlots()
const emit = defineEmits(['click'])

</script>
<template>
  <div class="border border-gray-200 rounded mb-4 cursor-pointer">
    <div
      class="py-3 flex cursor-pointer"
      @click="emit('click')"
    >
      <div class="px-5 border-r border-r-gray-200 flex items-center">
        <slot name="icon" />
      </div>
      <div class="px-3 flex-grow">
        <p class="text-indigo-700">
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
        <IconCaret />
      </div>
    </div>
    <div
      v-if="slots.warning"
    >
      <slot name="warning" />
    </div>
    <slot name="slider" />
  </div>
</template>
