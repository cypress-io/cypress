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
      {{ t('specPage.runSelectedSpecs', specNumber) }}
    </span>
  </button>
</template>

<script lang="ts" setup>
import { IconActionPlaySmall } from '@cypress-design/vue-icon'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{
  specNumber: number
  directory: string
}>()

const emits = defineEmits<{
  (event: 'runAllSpecs'): void
}>()
</script>
