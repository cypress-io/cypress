<template>
  <div class="flex items-center py-4px text-sm">
    <div class="flex">
      <DocumentIconBlank
        class="text-base group-hocus:(icon-dark-indigo-300 icon-light-indigo-600) group-hover:children:(transition-all ease-in-out duration-250)"
        :class="selected ? 'icon-dark-indigo-300 icon-light-indigo-600' : 'icon-dark-gray-800 icon-light-gray-1000'"
      />
      <span
        :class="{ 'text-white': selected }"
        class="font-medium text-gray-400 group-hocus:text-indigo-300 pl-10px whitespace-nowrap"
      >
        <template v-for="({char, highlighted}, idx) in fileNameCharacters">
          <span
            v-if="highlighted"
            :key="idx"
            class="text-white"
          >{{ char }}</span>
          <template v-else>
            {{ char }}
          </template>
        </template>
      </span>
    </div>
    <div class="font-light text-gray-700">
      <template v-for="({char, highlighted}, idx) in extensionCharacters">
        <span
          v-if="highlighted"
          :key="idx"
          class="text-white"
        >{{ char }}</span>
        <template v-else>
          {{ char }}
        </template>
      </template>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { computed } from 'vue'
import DocumentIconBlank from '~icons/cy/document-blank_x16'

const props = withDefaults(defineProps<{
  fileName: string
  extension: string
  selected: boolean
  indexes: number[]
}>(), { indexes: () => [], selected: false })

const fileNameCharacters = computed(() => {
  const fileNameIndexes = props.indexes.filter((idx) => idx < props.fileName.length)

  const characters = props.fileName.split('').map((char) => ({ char, highlighted: false }))

  fileNameIndexes.forEach((idx) => characters[idx].highlighted = true)

  return characters
})
const extensionCharacters = computed(() => {
  const extensionIndexes = props.indexes.filter((idx) => idx >= props.fileName.length)

  const characters = props.extension.split('').map((char) => ({ char, highlighted: false }))

  extensionIndexes.forEach((idx) => characters[idx - props.fileName.length].highlighted = true)

  return characters
})

</script>
