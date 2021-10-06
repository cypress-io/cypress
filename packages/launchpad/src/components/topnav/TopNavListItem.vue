<template>
  <li
    class="flex transition-colors duration-300 border-b border-b-gray-50"
    :class="selectable ? 'hover:bg-indigo-50' : ''"
  >
    <div v-if="$slots.prefix">
      <div class="flex items-center h-full align-middle">
        <slot name="prefix" />
      </div>
    </div>
    <div class="flex-grow">
      <slot />
    </div>
    <div>
      <div
        v-if="$slots.suffix"
        class="flex items-center h-full align-middle"
      >
        <slot name="suffix" />
      </div>
    </div>
  </li>
</template>
<script setup lang="ts">

defineProps<{
  selectable?: Boolean,
}>()

</script>
