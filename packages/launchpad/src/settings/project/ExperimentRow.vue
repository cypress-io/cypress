<template>
  <div role="row" class="grid grid-flow-row">
    <div class="inline leading-loose">
      <h3 class="text-indigo-600 text-md inline" role="rowheader">{{ experiment.name }}</h3>
      <span
        class="bg-purple-100 text-purple-600 rounded-sm text-sm py-2px px-4px ml-12px font-mono"
      >{{ experiment.key }}</span>
    </div>
    <span role="definition" class="text-cool-gray-500 text-sm">{{ experiment.description }}</span>
    <div
      class="row-start-1 row-end-3 col-start-2 col-end-auto inline-grid items-center justify-self-end ml-20px"
    >
      <StatusIndicator :type="experiment.enabled ? 'success' : 'disabled'">
        {{ experiment.enabled ? t('status.enabled') : t('status.disabled') }}
      </StatusIndicator>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { defineProps } from 'vue'
import StatusIndicator from '../../components/StatusIndicator.vue'
import { useI18n } from '../../composables';

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
