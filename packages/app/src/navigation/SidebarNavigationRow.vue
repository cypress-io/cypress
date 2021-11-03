<template>
  <div
    :class="[active ? 'before:bg-jade-300' : 'before:bg-transparent']"
    class="w-full
      min-w-40px
      relative
      flex
      items-center
      rounded-md
      group
      h-40px
      my-16px
      focus-visible:outline-none
      hover:before:bg-indigo-300
      focus:before:bg-indigo-300
      before:content-open-square
      before:mr-4px
      before:rounded-r-md
      before:text-transparent
      before:h-40px
      before:w-4px"
  >
    <span
      class="h-full
      flex
      items-center
      overflow-hidden
      ml-4px
      p-8px
      gap-20px
      rounded-lg
      children:group-focus:text-indigo-300
      children:group-hover:text-indigo-300"
    >
      <component
        :is="icon"
        v-if="icon"
        :class="active ? 'icon-dark-jade-300 icon-light-jade-800' : 'icon-dark-gray-800 icon-light-gray-900'"
        class="w-24px h-24px group-hover:icon-dark-indigo-300 group-hover:icon-light-indigo-600 group-focus:icon-dark-indigo-300 group-focus:icon-light-indigo-600"
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
