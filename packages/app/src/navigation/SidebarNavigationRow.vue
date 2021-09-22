<template>
  <a
    href="#"
    class="
    w-full
    rounded-md
    group
    flex
    min-w-40px
    relative
    items-center
    focus-visible:outline-none
    focus-within:text-indigo-500
    focus-within:before:bg-indigo-500
    hover:before:bg-indigo-500
    before:content-open-square before:mr-4px before:rounded-r-md before:text-transparent before:h-40px before:w-4px
    "
    :class="active"
  >
    <span class="h-full flex items-center overflow-hidden p-8px gap-20px rounded-lg">
      <component v-if="icon" :is="icon" class="min-w-24px
      group-hover:text-indigo-500
      focus-within:text-indigo-500
      "/>
      <span class="truncate"><slot></slot></span>
    </span>
  </a>
</template>

<script lang="ts" setup>
import { computed, defineProps } from 'vue'

const props = withDefaults(defineProps<{
  icon?: any
  active?: boolean
}>(), {
  active: false
})

const colors = computed(() => ({
  light: props.active ? `green-300` : `gray-300`,
  lightHover: `indigo-300`,
  dark: props.active ? `green-500` : `gray-300`,
  darkHover: `indigo-500`
}))

</script>
