<template>
  <div
    v-if="label"
    class="inline-flex rounded-md bg-gray-50 border-gray-200 border-[1px] text-sm px-[8px] text-gray-700 items-center py-[2px]"
    data-cy="runTag"
  >
    <component
      :is="icon"
      class="mr-2 icon-dark-gray-600 shrink-0"
    />
    <span
      class="sr-only"
    >
      {{ iconLabel }}
    </span>
    <span
      class="truncate"
      role="none"
    >
      {{ label }}
    </span>
  </div>
</template>

<script lang="ts" setup>
import type { Component } from 'vue'

defineProps<{
  label: string
  iconLabel?: string
  icon?: Component
}>()

</script>
