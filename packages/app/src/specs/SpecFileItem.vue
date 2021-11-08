<template>
  <div class="flex items-center py-4px text-sm">
    <DocumentIconBlank
      class="group-hocus:icon-dark-indigo-300 group-hocus:icon-light-indigo-600 text-base"
      :class="selected ? 'icon-dark-indigo-300 icon-light-indigo-600' : 'icon-dark-gray-800 icon-light-gray-1000'"
    />
    <span
      :class="{ 'text-white': selected }"
      class="font-medium text-gray-400 group-hocus:text-indigo-300 pl-10px whitespace-nowrap"
    >
      {{ fileName }}
    </span>
    <span class="font-light text-gray-700">{{ extension }}</span>
  </div>
</template>
<script lang="ts" setup>
import DocumentIconBlank from '~icons/cy/document-blank_x16'

defineProps<{
  fileName: string
  extension: string
  selected: boolean
}>()
</script>
<style></style>
