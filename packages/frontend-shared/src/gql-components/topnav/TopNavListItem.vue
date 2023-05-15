<template>
  <li
    class="border-b flex border-b-gray-50 transition-colors duration-300"
    :class="selectable ? 'hover:bg-indigo-50' : ''"
  >
    <div v-if="$slots.prefix">
      <div class="flex h-full items-center align-middle">
        <slot name="prefix" />
      </div>
    </div>
    <div class="grow">
      <slot />
    </div>
    <div>
      <div
        v-if="$slots.suffix"
        class="flex h-full items-center align-middle"
      >
        <slot name="suffix" />
      </div>
    </div>
  </li>
</template>
<script setup lang="ts">

defineProps<{
  selectable?: Boolean
}>()

</script>
