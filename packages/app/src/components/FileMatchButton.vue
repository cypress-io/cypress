<template>
  <button
    data-cy="file-match-button"
    class="inline-flex items-center h-full text-gray-700 transition duration-150 rounded-l outline-none group bg-gray-50 border-r-gray-100 border-r hocus:bg-indigo-50 hocus:border-r-indigo-300 hocus:text-indigo-500 px-[12px]"
  >
    <i-cy-chevron-right-small_x16
      class="transition duration-150 transform min-w-[16px] min-h-[16px] icon-dark-gray-400 group-hocus:icon-dark-indigo-400"
      :class="{
        'rotate-90': expanded
      }"
    />
    <slot />
  </button>
</template>

<script lang="ts" setup>
withDefaults(defineProps<{
  expanded: boolean
}>(), { expanded: false })
</script>
