<template>
  <div class="flex h-full items-center">
    <button
      class="h-full grid gap-[8px] grid-cols-[14px,16px,auto] items-center group focus:outline-none"
      :data-cy="`row-directory-depth-${depth}`"
      :aria-expanded="expanded"
      @click.stop="emits('toggle')"
    >
      <i-cy-chevron-down-small_x16
        class="
          mr-[8px] text-sm icon-dark-gray-300
          group-hocus:icon-dark-gray-700
        "
        :class="{'transform rotate-270': !expanded}"
      />
      <IconFolder class="icon-dark-white icon-light-gray-200" />
      <div
        :title="name"
        class="flex text-gray-600 truncate"
      >
        <HighlightedText
          :text="name"
          :indexes="indexes"
          class="font-medium"
          highlight-classes="text-gray-1000"
        />
      </div>
      <span class="sr-only">{{ expanded ? 'collapse' : 'expand' }}</span>
    </button>
    <slot />
  </div>
</template>

<script lang="ts" setup>
import IconFolder from '~icons/cy/folder_x16.svg'
import HighlightedText from './HighlightedText.vue'

withDefaults(defineProps<{ name: string, expanded: boolean, indexes: number[], depth: number }>(), {
  name: '',
  expanded: false,
  indexes: () => [],
})

const emits = defineEmits<{
  (event: 'toggle'): void
}>()

</script>
