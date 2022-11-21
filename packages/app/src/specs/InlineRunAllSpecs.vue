<template>
  <Tooltip
    placement="right"
    class="h-full truncate"
    data-cy="tooltip"
  >
    <button @click.stop="emits('runAllSpecs')">
      <IconActionPlaySmall
        size="16"
        stroke-color="gray-700"
        fill-color="transparent"
        hocus-stroke-color="indigo-500"
        hocus-fill-color="indigo-100"
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
        {{ t('specPage.runAllSpecs', specNumber) }}
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
}>()

const emits = defineEmits<{
  (event: 'runAllSpecs'): void
}>()
</script>
