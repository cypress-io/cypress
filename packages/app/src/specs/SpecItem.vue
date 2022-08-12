<template>
  <div
    class="h-full grid gap-8px grid-cols-[16px,auto,auto] items-center"
    data-cy="spec-item"
  >
    <i-cy-document-blank_x16
      class="icon-light-gray-50 icon-dark-gray-200 group-hocus:icon-light-indigo-200 group-hocus:icon-dark-indigo-400"
    />

    <div
      :title="fileName + extension"
      class="text-gray-400 text-indigo-500 truncate group-hocus:text-indigo-600"
    >
      <HighlightedText
        :text="fileName"
        :indexes="split.fileNameIndexes"
        class="font-medium text-indigo-500 group-hocus:text-indigo-700"
        highlight-classes="text-gray-1000"
      />
      <HighlightedText
        :text="extension"
        :indexes="split.extensionIndexes"
        class="font-light group-hocus:text-gray-400"
        highlight-classes="text-gray-1000"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { toRefs } from '@vueuse/core'
import HighlightedText from './HighlightedText.vue'
import { useSplitIndexes } from './spec-utils'

const props = withDefaults(defineProps<{
  fileName: string
  extension: string
  indexes?: number[]
}>(), { indexes: () => [] })

const refs = toRefs(props)
const split = useSplitIndexes(refs.fileName, refs.indexes)
</script>
