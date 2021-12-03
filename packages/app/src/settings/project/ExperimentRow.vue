<template>
  <div
    role="row"
    class="grid grid-flow-row"
  >
    <div class="inline-flex items-baseline">
      <h3
        class="text-md text-indigo-500 inline"
        role="rowheader"
      >
        {{ experiment.name }}
      </h3>
      <span
        class="rounded font-mono bg-gray-50 text-sm ml-8px py-2px px-4px text-purple-500"
      >{{ experiment.key }}</span>
    </div>
    <span
      role="definition"
      class="text-sm text-gray-600"
    >{{ experiment.description }}</span>
    <div
      class="ml-20px col-end-auto col-start-2 row-start-1 row-end-3 inline-grid items-center justify-self-end"
    >
      <StatusIndicator :type="experiment.enabled ? 'success' : 'disabled'">
        {{ experiment.enabled ? t('status.enabled') : t('status.disabled') }}
      </StatusIndicator>
    </div>
  </div>
</template>

<script lang="ts" setup>
import StatusIndicator from '@cy/components/StatusIndicator.vue'
import { useI18n } from '@cy/i18n'

export interface Experiment {
  key: string
  name: string
  description: string
  enabled: boolean
}

defineProps<{
  experiment: Experiment
}>()

const { t } = useI18n()
</script>
