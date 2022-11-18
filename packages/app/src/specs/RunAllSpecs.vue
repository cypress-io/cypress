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
        data-cy="play-button"
        @click.stop="emits('runAllSpecs')"
      />
    </button>
    <template
      #popper
    >
      <span
        class="font-normal text-sm font-family: SFPro-Display inline-flex"
        data-cy="tooltip-content"
      >
        Run {{ specNumber }} specs
      </span>
    </template>
  </Tooltip>

  <button
    v-else
    class="group hover:text-indigo-700 space-x-2 items-center ml-28px text-gray-600"
    data-cy="run-all-specs-button"
    @click.stop="emits('runAllSpecs')"
  >
    <IconActionPlaySmall
      size="16"
      stroke-color="gray-300"
      fill-color="gray-50"
      hover-stroke-color="indigo-500"
      hover-fill-color="indigo-100"
      interactive-colors-on-group
      class="group-hover: inline-flex align-text-bottom"
      data-cy="play-button"
    />
    <span
      class="font-normal text-sm"
      data-cy="run-all-specs-text"
    >
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

const emits = defineEmits<{
  (event: 'runAllSpecs'): void
}>()

</script>
