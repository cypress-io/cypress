<template>
  <li
    class="flex transition-colors duration-300 border-b border-b-gray-50"
    :class="selectable ? 'hover:bg-indigo-50' : ''"
  >
    <div v-if="hasPrefix">
      <div class="flex items-center h-full align-middle">
        <slot name="prefix" />
      </div>
    </div>
    <div class="flex-grow">
      <slot />
    </div>
    <div>
      <div
        v-if="hasSuffix"
        class="flex items-center h-full align-middle"
      >
        <slot name="suffix" />
      </div>
    </div>
  </li>
</template>
<script setup lang="ts">
import { useSlots, computed } from 'vue'
const slots = useSlots()

const hasPrefix = computed(() => {
  return Boolean(slots.prefix)
})

const hasSuffix = computed(() => {
  return Boolean(slots.suffix)
})

const props = defineProps<{
  selectable?: Boolean,
}>()

</script>
