<template>
  <div
    class="h-full grid gap-8px grid-cols-[16px,auto,auto] items-center"
    data-cy="spec-item"
  >
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="icon-light-gray-50 icon-dark-gray-200 group-hocus:icon-light-indigo-200 group-hocus:icon-dark-indigo-400"
    >
      <path
        d="M2 14V2C2 1.44772 2.44772 1 3 1H13C13.5523 1 14 1.44772 14 2V14C14 14.5523 13.5523 15 13 15H3C2.44772 15 2 14.5523 2 14Z"
        fill="#D0D2E0"
        class="icon-light"
      />
      <path
        d="M5 8H8M5 5H11M5 11H10M13 1L3 1C2.44772 1 2 1.44772 2 2V14C2 14.5523 2.44772 15 3 15H13C13.5523 15 14 14.5523 14 14V2C14 1.44772 13.5523 1 13 1Z"
        stroke="#1B1E2E"
        class="icon-dark"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>

    <div
      :title="fileName + extension"
      class="text-gray-400 text-indigo-500 truncate group-hocus:text-indigo-600"
    >
      <template v-if="highlightText">
        <HighlightedText
          :text="fileName"
          :indexes="indexes.filter((idx) => idx < fileName.length)"
          class="font-medium text-indigo-500 group-hocus:text-indigo-700"
          highlight-classes="text-gray-1000"
        />
        <HighlightedText
          :text="extension"
          :indexes="indexes.filter((idx) => idx >= fileName.length).map(idx => idx - fileName.length)"
          class="font-light group-hocus:text-gray-400"
          highlight-classes="text-gray-1000"
        />
      </template>
      <template v-else>
        <span class="font-medium text-indigo-500 group-hocus:text-indigo-700">{{ fileName }}</span>
        <span class="font-light group-hocus:text-gray-400">{{ extension }}</span>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import HighlightedText from './HighlightedText.vue'

withDefaults(defineProps<{
  fileName: string
  extension: string
  indexes?: number[]
  highlightText: boolean
}>(), { indexes: () => [] })
</script>
