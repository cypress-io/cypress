<template>
  <Tooltip
    placement="right"
    :disabled="isNavBarExpanded"
    :distance="8"
  >
    <div
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
      :data-selected="active"
    >
      <component
        :is="icon"
        v-if="active"
        stroke-color="indigo-300"
        fill-color="indigo-700"
        class="flex-shrink-0
        h-24px m-12px w-24px
        children:transition children:duration-300
        "
      />
      <component
        :is="icon"
        v-else
        stroke-color="gray-500"
        fill-color="gray-900"
        class="flex-shrink-0
        h-24px m-12px w-24px
        children:transition children:duration-300
        group-hover:(icon-dark-gray-300 icon-light-gray-800) group-focus:(icon-dark-gray-300 icon-light-gray-800) "
      />
      <span
        :class="[active ? 'text-indigo-300' : 'text-gray-500 group-hocus:text-gray-300']"
        class="ml-8px transition-colors duration-300 truncate"
      >
        {{ name }}
      </span>
    </div>
    <template #popper>
      {{ name }}
    </template>
  </Tooltip>
</template>

<script lang="ts" setup>
import type { FunctionalComponent, SVGAttributes } from 'vue'
import Tooltip from '@packages/frontend-shared/src/components/Tooltip.vue'

withDefaults(defineProps <{
  icon: FunctionalComponent<SVGAttributes>
  name: string
  // Currently active row (generally the current route)
  active?: boolean
  isNavBarExpanded: boolean
}>(), {
  active: false,
})

</script>
