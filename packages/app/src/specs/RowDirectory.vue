<template>
  <button
    class="h-full grid gap-8px grid-cols-[14px,16px,auto] items-center focus:outline-none"
    :data-cy="`row-directory-depth-${depth}`"
    :aria-expanded="expanded"
  >
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="
        mr-8px text-sm icon-dark-gray-300
        group-hocus:(icon-dark-gray-700)
      "
    >
      <path
        d="M4 6L8 10L12 6"
        stroke="currentColor"
        class="icon-dark"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    <svg
      width="16"
      height="14"
      viewBox="0 0 16 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="icon-dark-white icon-light-gray-200"
    >
      <path
        d="M14 13C14.5523 13 15 12.5523 15 12V4C15 3.44772 14.5523 3 14 3H9L7.29289 4.70711C7.10536 4.89464 6.851 5 6.58579 5H1V12C1 12.5523 1.44772 13 2 13H14Z"
        fill="#2E3247"
        class="icon-dark"
      />
      <path
        d="M9 3L7.29289 1.29289C7.10536 1.10536 6.851 1 6.58579 1H2C1.44772 1 1 1.44772 1 2V5M9 3H14C14.5523 3 15 3.44772 15 4V12C15 12.5523 14.5523 13 14 13H2C1.44772 13 1 12.5523 1 12V5M9 3L7.29289 4.70711C7.10536 4.89464 6.851 5 6.58579 5H1"
        stroke="#434861"
        stroke-width="2"
        stroke-linejoin="round"
        class="icon-light"
      />
    </svg>
    <div
      :title="props.name"
      class="text-gray-600 truncate"
    >
      <HighlightedText
        v-if="props.highlightText"
        :text="props.name"
        :indexes="props.indexes"
        class="font-medium"
        highlight-classes="text-gray-1000"
      />
      <span v-else>
        {{ props.name }}
      </span>
    </div>
    <span class="sr-only">{{ expanded ? 'collapse' : 'expand' }}</span>
  </button>
</template>

<script lang="ts" setup>
import HighlightedText from './HighlightedText.vue'

const props = withDefaults(defineProps<{
  name: string
  expanded: boolean
  indexes: number[]
  depth: number
  highlightText: boolean }>(), {
  name: '',
  expanded: false,
  indexes: () => [],
})
</script>
