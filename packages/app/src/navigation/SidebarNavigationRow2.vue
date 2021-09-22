<template>
  <a
    href="#"
    class="w-full
    focus-visible:outline-none
    focus-visible:ring-1
    focus-visible:ring-gray-600
    hover:ring-1
    hover:ring-gray-600
    rounded-md
    group
    flex
    min-w-40px
    relative
    items-center"
    :class="[
      style === 'tab' && [
        `before:content-open-square before:mr-4px before:rounded-r-md before:text-transparent before:h-40px before:w-4px`,
        tabPseudoElementColor // Gra
      ],
      // Row style has a background
      // Tab style does not
      cellBackgroundColors
    ]"
  >
    <span class="h-full flex items-center overflow-hidden p-8px gap-20px rounded-lg">
      <component v-if="icon" :is="icon" class="min-w-24px"
      :class="[
        iconColor,
        {
          'group-focus:text-white': !active
        }
      ]"
      />
      <span class="truncate group-focus:text-white" :class="textColor"><slot>Component Testing</slot></span>
    </span>
  </a>
</template>

<script lang="ts" setup>
import { computed, defineProps } from 'vue'

const props = withDefaults(defineProps<{
  icon?: any
  style?: 'tab' | 'row'

  // Selected, somehow
  selected?: boolean

  // Currently active row (generally the current route)
  active?: boolean
}>(), {
  style: 'row',
  selected: false,
  active: false
})

const iconColor = computed(() => {
  if (props.active) return 'text-green-400'
  else if (props.selected) return 'text-indigo-400'
  return 'text-gray-400'
})

const cellBackgroundColors = computed(() => {
  if (props.style === 'row') {
    if (props.active) {
      return 'bg-gray-700'
    }

    return 'hover:bg-gray-700'
  }
})

const textColor = computed(() => {
  if (props.active) {
    return props.style === 'row' ? 'text-white' : 'text-green-400'
  } else if (props.selected) return 'text-indigo-400'
  return 'text-gray-400'
})

const tabPseudoElementColor = computed(() => {
  if (!props.selected && !props.active) return 'before:text-transparent'
  return `before:${iconColor.value.replace('text', 'bg')}`
})

</script>
