<template>
  <div
    class="h-full grid grid-cols-[14px,16px,auto] items-center gap-8px"
    :data-cy="`row-directory-depth-${depth}`"
  >
    <i-cy-chevron-down-small_x16
      class="
        icon-dark-gray-300 mr-8px text-sm
        group-hocus:(icon-dark-gray-700)
      "
      :class="{'transform rotate-270': !expanded}"
    />
    <component
      :is="IconFolder"
      class="icon-dark-white icon-light-gray-200 document-icon"
    />
    <HighlightedText
      :text="props.name"
      :indexes="props.indexes"
      class="text-gray-600 font-medium"
      highlight-classes="text-gray-1000"
    />
  </div>
</template>

<script lang="ts" setup>
import IconFolder from '~icons/cy/folder_x16.svg'
import HighlightedText from './HighlightedText.vue'

const props = withDefaults(defineProps<{ name: string, expanded: boolean, indexes: number[], depth: number }>(), {
  name: '',
  expanded: false,
  indexes: () => [],
})
</script>
