<template>
  <Tooltip
    placement="right"
    :data-cy="`run-all-specs-for-${directory}`"
  >
    <button
      class="flex h-full w-full items-center justify-center"
      data-cy="run-all-specs-button"
      :aria-label="t('specPage.runSelectedSpecs', specNumber)"
      :disabled="specNumber === 0"
      @click.stop="emits('runAllSpecs')"
    >
      <IconActionPlaySmall
        size="16"
        :stroke-color="grayscale ? 'gray-200' : 'gray-700'"
        fill-color="transparent"
        :hocus-stroke-color="grayscale ? undefined : 'indigo-500'"
        :hocus-fill-color="grayscale ? undefined : 'indigo-100'"
        class="inline-flex align-text-bottom"
        data-cy="play-button"
      />
    </button>
    <template
      #popper
    >
      <span
        class="font-normal text-sm inline-flex"
        data-cy="tooltip-content"
      >
        {{ t('specPage.runSelectedSpecs', specNumber) }}
      </span>
    </template>
  </Tooltip>
</template>

<script lang="ts" setup>
import { IconActionPlaySmall } from '@cypress-design/vue-icon'
import Tooltip from '@packages/frontend-shared/src/components/Tooltip.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{
  specNumber: number
  directory: string
  grayscale?: boolean
}>()

const emits = defineEmits<{
  (event: 'runAllSpecs'): void
}>()

</script>
