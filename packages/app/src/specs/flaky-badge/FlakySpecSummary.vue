<template>
  <div
    class="border-t-4px min-w-200px w-full max-w-400px grid p-4 gap-4 grid-cols-1 justify-items-center"
    :class="severity?.accentClass"
    data-cy="flaky-spec-summary"
  >
    <SpecNameDisplay
      :spec-file-name="specName"
      :spec-file-extension="specExtension"
    />
    <div class="flex flex-row w-full text-size-14px justify-center items-center">
      <component :is="severity?.icon" />
      <span
        class="font-medium ml-2"
        :class="severity?.textClass"
      >{{ severity?.label }}</span>
      <span
        class="ml-4"
        data-cy="flaky-rate"
      >{{ t('specPage.flaky.flakyRate', [flakyRate]) }}</span>
    </div>

    <div class="w-full grid text-gray-700 text-size-14px gap-2 grid-cols-2 justify-items-center">
      <span data-cy="flaky-runs">{{ t('specPage.flaky.flakyRuns', { count: totalFlakyRuns, flakyRuns: totalFlakyRuns, totalRuns }) }}</span>
      <span data-cy="last-flaky">{{ t('specPage.flaky.lastFlaky', { count: runsSinceLastFlake, runsSinceLastFlake }) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">

import { computed } from 'vue'
import { useI18n } from '@cy/i18n'
import SpecNameDisplay from '../SpecNameDisplay.vue'
import LowRateIcon from '~icons/cy/rate-low_x16'
import MediumRateIcon from '~icons/cy/rate-medium_x16'
import HighRateIcon from '~icons/cy/rate-high_x16'

const { t } = useI18n()

const props = defineProps<{
  specName: string
  specExtension: string
  severity: 'low' | 'medium' | 'high'
  totalFlakyRuns: number
  totalRuns: number
  runsSinceLastFlake: number
  dashboardUrl: string
}>()

const flakyRate = computed(() => {
  if (props.totalFlakyRuns <= 0 || props.totalRuns <= 0) {
    return 0
  }

  const rawRate = props.totalFlakyRuns / props.totalRuns * 100

  // Only display 100 if rawRate is actually 100 (do not round to 100)
  if (rawRate > 99 && rawRate < 100) {
    return 99
  }

  return Math.ceil(rawRate)
})

const severity = computed(() => {
  switch (props.severity) {
    case 'low':
      return {
        accentClass: 'border-t-orange-400',
        textClass: 'text-orange-400',
        label: t('specPage.flaky.severityLow'),
        icon: LowRateIcon,
      }
    case 'medium':
      return {
        accentClass: 'border-t-orange-500',
        textClass: 'text-orange-500',
        label: t('specPage.flaky.severityMedium'),
        icon: MediumRateIcon,
      }
    case 'high':
      return {
        accentClass: 'border-t-orange-600',
        textClass: 'text-orange-600',
        label: t('specPage.flaky.severityHigh'),
        icon: HighRateIcon,
      }
    default:
      return undefined
  }
})

</script>
