<template>
  <div class="flex items-center group py-4px text-sm">
    <component
      :is="DocumentIconBlank"
      class="group-hover:icon-dark-indigo-300 group-hover:icon-light-indigo-600 text-base"
      :class="{
        'icon-dark-indigo-300 icon-light-indigo-600': selected,
        'icon-dark-gray-800 icon-light-gray-1000': !selected,
      }"
    />
    <span
      :class="{ 'text-white': selected }"
      class="font-medium text-gray-400 group-hocus:text-indigo-300 pl-10px"
    >
      {{ fileName }}
    </span>
    <span class="font-light text-gray-700">{{ extension }}</span>
  </div>
</template>
<script lang="ts" setup>
import DocumentIconBlank from "~icons/cy/document-blank_x16";

defineProps<{
  fileName: string
  extension: string
  selected: boolean
}>()
</script>
<style></style>
