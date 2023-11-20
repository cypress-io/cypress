<template>
  <div class="flex justify-between">
    <div
      :title="name"
      class="flex text-sm py-[4px] items-center"
    >
      <i-cy-chevron-down-small_x16
        class="mr-[8px] icon-dark-gray-700 group-hocus:icon-dark-indigo-300 group-hover:children:transition-all group-hover:children:ease-in-out"
        :class="{'transform rotate-270': !expanded}"
      />
      <i-cy-folder_x16 class="h-[16px] mr-[8px] w-[16px] group-hocus:icon-light-indigo-300 group-hocus:icon-dark-indigo-400" />
      <HighlightedText
        :text="name"
        :indexes="indexes"
        class="text-gray-400 group-focus:text-indigo-300"
        highlight-classes="font-bold text-white"
      />
    </div>
    <div class="mr-[16px]">
      <slot name="run-all-specs" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import HighlightedText from './HighlightedText.vue'

withDefaults(defineProps<{ name: string, expanded: boolean, indexes: number[] }>(), {
  name: '',
  expanded: false,
  indexes: () => [],
})
</script>
