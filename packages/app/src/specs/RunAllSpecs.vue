<template>
  <Tooltip
    v-if="runner"
    placement="right"
    class="h-full truncate"
    data-cy="tooltip"
  >
    <button>
      <IconActionPlaySmall
        size="16"
        stroke-color="gray-700"
        fill-color="transparent"
        hover-stroke-color="indigo-500"
        hover-fill-color="indigo-100"
        class="ml-76px inline-flex align-text-bottom"
      />
    </button>
    <template
      #popper
    >
      <div data-cy="run-all-specs-tooltip">
        <span class="font-normal text-sm font-family: SFPro-Display inline-flex">
          Run {{ specNumber }} specs
        </span>
      </div>
    </template>
  </Tooltip>

  <button
    v-else
    class="group hover:text-indigo-700 space-x-2 items-center ml-28px"
  >
    <IconActionPlaySmall
      size="16"
      stroke-color="gray-300"
      fill-color="gray-50"
      hover-stroke-color="indigo-500"
      hover-fill-color="indigo-100"
      interactive-colors-on-group
      class="inline-flex align-text-bottom"
    />
    <span class="font-normal text-sm font-family: SFPro-Display inline-flex">
      Run {{ specNumber }} specs
    </span>
  </button>
</template>

<script lang="ts" setup>
import { IconActionPlaySmall } from '@cypress-design/vue-icon'
import Tooltip from '@packages/frontend-shared/src/components/Tooltip.vue'

withDefaults(defineProps<{ specNumber: number, runner: boolean }>(), {
  specNumber: 0,
  runner: false,
})
</script>
