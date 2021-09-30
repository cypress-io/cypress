<template>
  <li class="flex border-b border-b-gray-50">
    <div v-if="hasPrefix">
      <slot name="prefix" />
    </div>
    <div class="flex-grow">
      <slot />
    </div>
    <div>
      <slot name="suffix" />
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
