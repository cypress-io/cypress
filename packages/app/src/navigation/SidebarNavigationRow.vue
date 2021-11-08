<template>
  <div
    :class="[active ? 'before:bg-jade-300' : 'before:bg-transparent']"
    class="relative flex items-center w-full rounded-md min-w-40px group focus-visible:outline-none hover:before:bg-indigo-300 focus:before:bg-indigo-300 before:content-open-square before:mr-4px before:rounded-r-md before:text-transparent before:h-40px before:w-4px"
  >
    <span
      class="flex items-center h-full overflow-hidden rounded-lg p-8px gap-20px children:group-focus:text-indigo-300 children:group-hover:text-indigo-300"
    >
      <component
        :is="icon"
        v-if="icon"
        :class="[active ? 'icon-dark-jade-300 icon-light-jade-800' : 'icon-dark-gray-800 icon-light-gray-900']"
        class="min-w-24px min-h-24px group-hover:icon-dark-indigo-300 group-hover:icon-light-indigo-600 group-focus:icon-dark-indigo-300 group-focus:icon-light-indigo-600"
      />
      <span
        :class="[active ? 'text-jade-300' : 'text-gray-400']"
        class="truncate"
      >
        <slot />
      </span>
    </span>
  </div>
</template>

<script lang="ts" setup>
import type { FunctionalComponent, SVGAttributes } from 'vue'

withDefaults(defineProps <{
  icon: FunctionalComponent<SVGAttributes, {}>
  // Currently active row (generally the current route)
  active: boolean
  }>(), {
  active: false,
  icon: undefined,
})
</script>
