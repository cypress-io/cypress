<template>
  <button
    data-cy="file-match-button"
    class="rounded-l h-full outline-none bg-gray-50 border-r-gray-100 border-r-1 px-12px transition text-gray-700 duration-150 inline-flex items-center group"
    :class="[ disabled ? 'disabled' : 'hocus:bg-indigo-50 hocus:border-r-indigo-300 hocus:text-indigo-500']"
    :disabled="disabled"
  >
    <i-cy-chevron-right-small_x16
      v-if="!disabled"
      class="min-w-16px min-h-16px transform transition duration-150 icon-dark-gray-400 group-hocus:icon-dark-indigo-400"
      :class="{
        'rotate-90': expanded
      }"
    />
    <slot />
  </button>
</template>

<script lang="ts" setup>
withDefaults(defineProps<{
  expanded?: boolean
  disabled?: boolean
}>(), { expanded: false, disabled: false })
</script>
