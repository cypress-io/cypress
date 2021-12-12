<template>
  <div
    v-for="(file, index) in files"
    :key="file"
    class="flex border-t-gray-50 h-40px mx-16px items-center"
    :class="{'border-t': index > 0}"
  >
    <i-cy-document-text_x16 class="h-16px mr-8px w-16px inline-block icon-dark-gray-400 icon-light-gray-50" />
    <HighlightedFile
      :file="file"
      :highlight-reg-exp="highlightRegExp"
      :highlight-class="highlightClass"
    /><br>
  </div>
</template>

<script lang="ts" setup>
import HighlightedFile from './HighlightedFile.vue'

withDefaults(defineProps<{
  files:string[];
  highlightRegExp: RegExp,
  highlightClass?: string
}>(), {
  highlightClass: 'text-gray-500',
})
</script>
