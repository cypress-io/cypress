<template>
  <div
    class="flex text-sm py-4px items-center children:group-focus:text-indigo-300"
    :class="{'children:text-indigo-300': selected }"
  >
    <DocumentIconBlank
      class="text-base
      min-h-16px min-w-16px
      group-hocus:icon-dark-indigo-300
      group-hocus:icon-light-indigo-600"
      :class="selected ? 'icon-dark-indigo-300 icon-light-indigo-600' : 'icon-dark-gray-800 icon-light-gray-1000'"
    />
    <HighlightedText
      :text="fileName"
      :indexes="indexes.filter((idx) => idx < fileName.length)"
      class="font-medium pl-8px text-gray-400 whitespace-nowrap "
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
