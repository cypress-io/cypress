<template>
  <div
    :href="dashboardUrl"
    class="border-t-4px min-w-200px w-full max-w-400px grid p-4 gap-4 grid-cols-1 justify-items-center"
    :class="accentClass"
    data-cy="flaky-spec-summary"
  >
    <SpecNameDisplay
      :spec-file-name="specName"
      :spec-file-extension="specExtension"
    />
    <div class="flex flex-row w-full text-size-14px justify-center items-center">
      <component :is="severityIcon" />
      <span
        class="font-medium ml-2"
        :class="textClass"
      >{{ severityLabel }}</span>
      <span
        class="ml-4"
        data-cy="flaky-rate"
      >{{ t('specPage.flaky.flakyRate', [flakyRate]) }}</span>
    </div>

    <div class="w-full grid text-gray-700 text-size-14px gap-2 grid-cols-2 justify-items-center">
      <span data-cy="flaky-runs">{{ t('specPage.flaky.flakyRuns', [totalFlakyRuns, totalRuns]) }}</span>
      <span data-cy="last-flaky">{{ t('specPage.flaky.lastFlaky', [lastFlaky]) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">

import { computed, FunctionalComponent, ref, shallowRef, watch } from 'vue'
import { useI18n } from '@cy/i18n'
import SpecNameDisplay from '../SpecNameDisplay.vue'
import LowRateIcon from '~icons/cy/rate-low_x16'
import MediumRateIcon from '~icons/cy/rate-medium_x16'
import HighRateIcon from '~icons/cy/rate-high_x16'
import ceil from 'lodash/ceil'

const { t } = useI18n()

const props = defineProps<{
  specName: string
  specExtension: string
  severity: 'low' | 'medium' | 'high'
  totalFlakyRuns: number
  totalRuns: number
  lastFlaky: number
  dashboardUrl: string
}>()

const accentClass = ref<string | null>(null)
const textClass = ref<string | null>(null)
const severityLabel = ref<string | null>(null)
const severityIcon = shallowRef<FunctionalComponent | null>(null)
const flakyRate = computed(() => {
  if (props.totalFlakyRuns <= 0 || props.totalRuns <= 0) {
    return 0
  }

  const rawRate = props.totalFlakyRuns / props.totalRuns * 100

  if (rawRate > 99 && rawRate < 100) {
    return 99
  }

  return ceil(rawRate)
})

watch(() => props.severity, (severityValue) => {
  switch (severityValue) {
    case 'low':
      accentClass.value = 'border-t-orange-400'
      textClass.value = 'text-orange-400'
      severityLabel.value = t('specPage.flaky.severityLow')
      severityIcon.value = LowRateIcon
      break
    case 'medium':
      accentClass.value = 'border-t-orange-500'
      textClass.value = 'text-orange-500'
      severityLabel.value = t('specPage.flaky.severityMedium')
      severityIcon.value = MediumRateIcon
      break
    case 'high':
      accentClass.value = 'border-t-orange-600'
      textClass.value = 'text-orange-600'
      severityLabel.value = t('specPage.flaky.severityHigh')
      severityIcon.value = HighRateIcon
      break
    default:
      break
  }
}, { immediate: true })

</script>
