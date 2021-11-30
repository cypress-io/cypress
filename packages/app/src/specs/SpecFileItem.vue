<template>
  <div class="flex items-center py-4px text-sm">
    <DocumentIconBlank
      class="text-base group-hocus:(icon-dark-indigo-300 icon-light-indigo-600) group-hover:children:(transition-all ease-in-out duration-250)"
      :class="selected ? 'icon-dark-indigo-300 icon-light-indigo-600' : 'icon-dark-gray-800 icon-light-gray-1000'"
    />
    <HighlightedText
      :text="fileName"
      :indexes="indexes.filter((idx) => idx < fileName.length)"
      class="pl-8px text-gray-400 font-medium text-gray-400 group-hocus:text-indigo-300 whitespace-nowrap"
      :class="{ 'text-white': selected }"
    />
    <HighlightedText
      :text="extension"
      :indexes="indexes.filter((idx) => idx >= fileName.length).map(idx => idx - fileName.length)"
      class="text-gray-700"
    />
  </div>
</template>
<script lang="ts" setup>
import DocumentIconBlank from '~icons/cy/document-blank_x16'
import HighlightedText from './HighlightedText.vue'

withDefaults(defineProps<{
  fileName: string
  extension: string
  selected?: boolean
  indexes: number[]
}>(), { indexes: () => [], selected: false })

</script>
