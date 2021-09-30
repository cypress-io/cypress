<template>
  <li class="flex border-b border-b-gray-50">
    <div v-if="hasPrefix">
      <div class="flex items-center h-full align-middle">
        <slot name="prefix" />
      </div>
    </div>
    <div class="flex-grow">
      <slot />
    </div>
    <div>
      <div class="flex items-center h-full align-middle">
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
</script>
