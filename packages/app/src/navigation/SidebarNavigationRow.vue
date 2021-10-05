<template>
  <a
    href="#"
    :class="[active ? 'before:bg-green-300' : 'before:bg-transparent']"
    class="w-full
      min-w-40px
      relative
      flex
      items-center
      rounded-md
      group
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
      p-8px
      gap-20px
      rounded-lg
      children:group-focus:text-indigo-300
      children:group-hover:text-indigo-300"
    >
      <component
        :is="icon"
        v-if="icon"
        :class="[active ? 'icon-dark-green-300 icon-light-green-800' : 'icon-dark-gray-500 icon-light-gray-800']"
        class="min-w-24px min-h-24px group-hover:icon-dark-indigo-300 group-hover:icon-light-indigo-900 group-focus:icon-dark-indigo-300 group-focus:icon-light-indigo-900"
      />
      <span
        :class="[active ? 'text-green-300' : 'text-gray-500']"
        class="truncate"
      >
        <slot />
      </span>
    </span>
  </a>
</template>

<script lang="ts" setup>
import type { FunctionalComponent, SVGAttributes } from 'vue'

withDefaults(defineProps <{
  icon?: FunctionalComponent<SVGAttributes, {}>
  // Currently active row (generally the current route)
  active?: boolean
  }>(), {
  active: false,
  icon: undefined,
})
</script>
