<template>
  <button
    class="group hover:text-indigo-700 space-x-2 items-center ml-28px text-gray-600 whitespace-nowrap"
    :data-cy="`run-all-specs-for-${directory}`"
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

defineProps<{
  specNumber: number
  directory: string
}>()

const emits = defineEmits<{
  (event: 'runAllSpecs'): void
}>()
</script>
