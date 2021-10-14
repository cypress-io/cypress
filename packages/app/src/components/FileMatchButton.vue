<template>
  <button class="inline-flex items-center h-full text-gray-700 transition duration-150 rounded-l outline-none group bg-gray-50 border-r-gray-100 border-r-1 hocus:bg-indigo-50 hocus:border-r-indigo-300 hocus:text-indigo-500 pl-12px pr-16px gap-8px">
    <i-cy-chevron-right-small_x16 class="transition duration-150 transform min-w-16px min-h-16px icon-dark-gray-400 group-hocus:icon-dark-indigo-400"
    :class="{
      'rotate-90': expanded
    }"/>
    <span><slot></slot></span>
  </button>
</template>

<script lang="ts" setup>
defineProps<{
  expanded: boolean
}>()
</script>