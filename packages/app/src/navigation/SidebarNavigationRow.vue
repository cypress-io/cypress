<template>
  <SidebarTooltip
    :class="active
      ? 'before:(bg-indigo-300 scale-x-100 transition-colors) cursor-default'
      : 'before:(scale-x-0 transition-transform bg-gray-300)'"
    class="rounded-md
      flex
      h-40px
      my-16px
      w-full
      min-w-40px
      relative
      items-center
      group
      focus-visible:outline-none
      before:(rounded-r-md h-40px mr-4px text-transparent transform origin-left w-4px duration-300 content-open-square) hover:before:scale-x-100 "
    :disabled="mainStore.navBarExpanded"
  >
    <component
      :is="
        icon"
      :class="active ? 'icon-dark-indigo-300 icon-light-indigo-700' : 'icon-dark-gray-500 icon-light-gray-900 group-hover:(icon-dark-gray-300 icon-light-gray-800) group-focus:(icon-dark-gray-300 icon-light-gray-800)'"
      class="flex-shrink-0 h-24px m-12px w-24px
            children:transition children:duration-300"
    />
    <span
      :class="[active ? 'text-indigo-300' : 'text-gray-500 group-hocus:text-gray-300']"
      class="ml-8px transition-colors duration-300 truncate"
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
