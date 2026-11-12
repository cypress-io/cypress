<template>
  <button
    class="h-full space-x-2 ml-[24px] text-gray-600 group items-center whitespace-nowrap hocus:text-indigo-700"
    :data-cy="`run-all-specs-for-${directory}`"
    @click.stop="emits('runAllSpecs')"
  >
    <IconActionPlaySmall
      size="16"
      stroke-color="gray-300"
      fill-color="gray-50"
      hocus-stroke-color="indigo-500"
      hocus-fill-color="indigo-100"
      interactive-colors-on-group
      class="align-text-bottom group-hover: inline-flex "
      data-cy="play-button"
    />
    <span
      class="font-normal text-sm"
      data-cy="run-all-specs-text"
    >
      {{ runSelectedSpecsText }}
    </span>
  </button>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { IconActionPlaySmall } from '@cypress-design/vue-icon'

const props = defineProps<{
  specNumber: number
  directory: string
}>()

const runSelectedSpecsText = computed(() => {
  return props.specNumber === 1 ? 'Run 1 spec' : `Run ${props.specNumber} specs`
})

const emits = defineEmits<{
  (event: 'runAllSpecs'): void
}>()
</script>
