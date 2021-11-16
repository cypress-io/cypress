<template>
  <div class="flex items-center py-4px text-sm">
    <i-cy-chevron-down-small_x16
      class="icon-dark-gray-700 mr-8px group-hocus:(icon-dark-gray-300) group-hover:children:(transition-all ease-in-out duration-250)"
      :class="{'transform rotate-270': !expanded}"
    />
    <i-cy-folder_x16 class="mr-8px w-16px h-16px" />
    <span class="text-gray-400">
      <span
        v-for="({char, highlighted}, idx) in characters"
        :key="idx"
        :class="{'px-4px': char === '/'}"
      >
        <span
          v-if="highlighted"
          class="text-white"
        >{{ char }}</span>
        <template v-else>
          {{ char }}
        </template>

      </span>
    </span>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const props = withDefaults(defineProps<{ name: string, expanded: boolean, indexes: number[] }>(), {
  name: '',
  expanded: false,
  indexes: () => [],
})

const characters = computed(() => {
  const chars = props.name.split('').map((char) => ({ char, highlighted: false }))

  props.indexes.forEach((idx) => chars[idx].highlighted = true)

  return chars
})
</script>
