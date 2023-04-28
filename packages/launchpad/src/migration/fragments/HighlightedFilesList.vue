<template>
  <div class="py-[4px]">
    <div
      v-for="(file, index) in files"
      :key="index"
      class="flex border-t-gray-50 h-[40px] mx-[16px] items-center"
      :class="{'border-t': index > 0}"
    >
      <i-cy-document-text_x16 class="h-[16px] mr-[8px] w-[16px] inline-block icon-dark-gray-400 icon-light-gray-50" />
      <HighlightedFile
        :parts="file.parts"
        :highlight-class="highlightClass"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { FilePart } from '../../utils/stringToRegexp'
import HighlightedFile from './HighlightedFile.vue'

withDefaults(defineProps<{
  files: Readonly<Array<{ parts: readonly FilePart[] }>>
  highlightClass?: string
}>(), {
  highlightClass: 'text-gray-500',
})
</script>
