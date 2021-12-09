<template>
  <SidebarTooltip
    :class="active
      ? 'before:bg-jade-300 before:scale-x-100 before:transition-colors'
      : 'before:scale-x-0 before:transition-transform'"
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
      before:content-open-square
      before:mr-4px
      before:rounded-r-md
      before:text-transparent
      before:h-40px
      before:w-4px
      before:bg-indigo-300
      before:transform before:origin-left
      before:duration-300
      hover:before:scale-x-100
      hover:before:bg-indigo-300
      focus:before:bg-indigo-300"
    :disabled="mainStore.navBarExpanded"
  >
    <component
      :is="
        icon"
      :class="active ? 'icon-dark-jade-300 icon-light-jade-800' : 'icon-dark-gray-500 icon-light-gray-900'"
      class="w-24px h-24px flex-shrink-0 m-12px
            group-hover:icon-dark-indigo-300 group-hover:icon-light-indigo-600
            group-focus:icon-dark-indigo-300 group-focus:icon-light-indigo-600
            children:transition children:duration-300"
    />
    <span
      :class="[active ? 'text-jade-300' : 'text-gray-500']"
      class="ml-8px truncate group-hocus:text-indigo-300 transition-colors duration-300"
    >
      {{ name }}
    </span>
    <template #popper>
      {{ name }}
    </template>
  </SidebarTooltip>
</template>

<script lang="ts" setup>
import type { FunctionalComponent, SVGAttributes } from 'vue'
import { useMainStore } from '../store'
import SidebarTooltip from './SidebarTooltip.vue'

withDefaults(defineProps <{
  icon: FunctionalComponent<SVGAttributes, {}>,
  name: string,
  // Currently active row (generally the current route)
  active?: boolean
  }>(), {
  active: false,
})

const mainStore = useMainStore()
</script>
