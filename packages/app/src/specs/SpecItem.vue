<template>
  <div class="h-full grid grid-cols-[16px,auto,auto] items-center gap-10px">
    <component
      :is="DocumentIconBlank"
      class='icon-light-gray-50 icon-dark-gray-200 document-icon'
    />

    <div
      class="text-gray-400 group-hocus:text-indigo-500"
      :title="`${spec.fileName}${spec.specFileExtension}`"
    >
      <span class="font-medium text-gray-700 group-hocus:text-indigo-500">{{ spec.fileName }}</span>
      <span class="font-light group-hocus:text-indigo-500">{{ spec.specFileExtension }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import DocumentIconBlank from '~icons/cy/document-blank_x16'

defineProps<{
  spec: {
    fileName: string
    specFileExtension: string
  }
}>()
</script>