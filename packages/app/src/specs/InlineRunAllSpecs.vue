<template>
  <Tooltip
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
        class="inline-flex align-text-bottom"
        data-cy="play-button"
        @click.stop="emits('runAllSpecs')"
      />
    </button>
    <template
      #popper
    >
      <span
        class="font-normal text-sm inline-flex"
        data-cy="tooltip-content"
      >
        Run {{ specNumber }} specs
      </span>
    </template>
  </Tooltip>
</template>

<script lang="ts" setup>
import { IconActionPlaySmall } from '@cypress-design/vue-icon'
import Tooltip from '@packages/frontend-shared/src/components/Tooltip.vue'

defineProps<{
  specNumber: number
  directory: string
}>()

const emits = defineEmits<{
  (event: 'runAllSpecs'): void
}>()
</script>
