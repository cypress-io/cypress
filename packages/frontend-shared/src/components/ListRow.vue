<script setup lang="ts">
import { useSlots } from 'vue'

const slots = useSlots()
const emit = defineEmits(['click'])

</script>
<template>
  <button
    class="block w-full mb-4 overflow-hidden border border-gray-100 rounded bg-light-50 hocus-default"
    tabindex="0"
    @click="emit('click')"
  >
    <div
      class="flex items-center w-full text-left rounded cursor-pointer py-10px"
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
    </div>
    <div
      v-if="slots.slider"
      @click.stop=""
    >
      <slot name="slider" />
    </div>
  </button>
</template>
