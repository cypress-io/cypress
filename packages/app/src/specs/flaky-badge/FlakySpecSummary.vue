<template>
  <div
    class="border-t-[4px] min-w-[300px] w-full max-w-[400px] grid p-4 gap-3 grid-cols-1 justify-items-center"
    :class="severity.accentClass"
    data-cy="flaky-spec-summary"
  >
    <SpecNameDisplay
      :spec-file-name="specName"
      :spec-file-extension="specExtension"
    />
    <template v-if="severity === SEVERITIES.LOADING">
      <div
        class="bg-gray-50 rounded-[20px] h-[15px] w-full animate-pulse"
        data-cy="flaky-specsummary-loading-1"
      />
      <div
        class="bg-gray-50 rounded-[20px] h-[15px] w-full animate-pulse "
        data-cy="flaky-specsummary-loading-2"
      />
    </template>
    <template v-else>
      <div class="flex flex-row w-full text-sm justify-center items-center">
        <component :is="severity.icon" />
        <span
          class="font-medium ml-2"
          :class="severity.textClass"
        >{{ severity?.label }}</span>
        <span
          class="ml-4 text-gray-800"
          data-cy="flaky-rate"
        >{{ t('specPage.flaky.flakyRate', [flakyRate]) }}</span>
      </div>

      <div class="flex flex-row text-gray-700 text-sm items-center">
        <span data-cy="flaky-runs">{{ t('specPage.flaky.flakyRuns', { count: totalFlakyRuns, flakyRuns: totalFlakyRuns, totalRuns }) }}</span>
        <i-cy-dot-solid_x4
          width="4"
          height="4"
          class="mx-2 icon-light-gray-200"
        />
        <span data-cy="last-flaky">{{ t('specPage.flaky.lastFlaky', { count: runsSinceLastFlake, runsSinceLastFlake }) }}</span>
      </div>
    </template>
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

const SEVERITIES = {
  LOADING: {
    accentClass: 'border-t-orange-400',
    textClass: null,
    label: null,
    icon: null,
  },
  LOW: {
    accentClass: 'border-t-orange-400',
    textClass: 'text-orange-400',
    label: t('specPage.flaky.severityLow'),
    icon: LowRateIcon,
  },
  MEDIUM: {
    accentClass: 'border-t-orange-500',
    textClass: 'text-orange-500',
    label: t('specPage.flaky.severityMedium'),
    icon: MediumRateIcon,
  },
  HIGH: {
    accentClass: 'border-t-orange-600',
    textClass: 'text-orange-600',
    label: t('specPage.flaky.severityHigh'),
    icon: HighRateIcon,
  },
}

const props = defineProps<{
  specName: string
  specExtension: string
  severity: string
  totalFlakyRuns: number
  totalRuns: number
  runsSinceLastFlake: number
}>()

const flakyRate = computed(() => {
  if (props.totalFlakyRuns <= 0 || props.totalRuns <= 0) {
    return 0
  }

  const rawRate = (props.totalFlakyRuns / props.totalRuns) * 100

  // Only display 100 if rawRate is actually 100 (do not round to 100)
  if (rawRate > 99 && rawRate < 100) {
    return 99
  }

  return Math.ceil(rawRate)
})

const severity = computed(() => SEVERITIES[props.severity?.toUpperCase()] || SEVERITIES.LOADING)

</script>
