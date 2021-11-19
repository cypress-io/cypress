<template>
  <div class="flex items-center py-4px text-sm">
    <i-cy-chevron-down-small_x16
      class="icon-dark-gray-700 mr-8px group-hocus:(icon-dark-gray-300) group-hover:children:(transition-all ease-in-out duration-250)"
      :class="{'transform rotate-270': !expanded}"
    />
    <i-cy-folder_x16 class="mr-8px w-16px h-16px" />
    <HighlightedText
      :text="props.name"
      :indexes="props.indexes"
      class="text-gray-400"
    />
  </div>
</template>

<script lang="ts" setup>
import HighlightedText from './HighlightedText.vue'

const props = withDefaults(defineProps<{ name: string, expanded: boolean, indexes: number[] }>(), {
  name: '',
  expanded: false,
  indexes: () => [],
})
</script>
