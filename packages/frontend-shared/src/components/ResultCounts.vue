<template>
  <div class="border rounded flex border-gray-200 h-6 text-gray-700 text-size-14px leading-20px">
    <div
      v-for="(result, i) in results"
      :key="i"
      class="flex px-2 items-center"
      :title="result.name"
      :data-cy="`runResults-${result.name}-count`"
    >
      <component
        :is="result.icon"
        class="mt-px h-12px mr-1 w-12px"
        :class="result.class"
      />
      <span class="sr-only">{{ result.name }}</span>
      {{ result.value }}
    </div>
  </div>
</template>

<script lang="ts" setup>
export interface ResultCountsProps {
  totalPassed: number|string|null
  totalFailed: number|string|null
  totalPending: number|string|null
  totalSkipped: number|string|null
}

import { computed } from 'vue'
import SkippedIcon from '~icons/cy/status-skipped_x12.svg'
import PassedIcon from '~icons/cy/status-passed_x12.svg'
import FailedIcon from '~icons/cy/status-failed_x12.svg'
import PendingIcon from '~icons/cy/status-pending_x12.svg'
import { useI18n } from '@cy/i18n'
const { t } = useI18n()

const props = defineProps<ResultCountsProps>()

const results = computed(() => {
  return [
    {
      value: props.totalSkipped,
      class: 'icon-dark-gray-400',
      icon: SkippedIcon,
      name: t('runs.results.skipped'),
    },
    {
      value: props.totalPending,
      class: 'icon-dark-gray-400 icon-light-white',
      icon: PendingIcon,
      name: t('runs.results.pending'),
    },
    {
      value: props.totalPassed,
      class: 'icon-dark-jade-400',
      icon: PassedIcon,
      name: t('runs.results.passed'),
    },
    {
      value: props.totalFailed,
      class: 'icon-dark-red-400',
      icon: FailedIcon,
      name: t('runs.results.failed'),
    },
  ]
})

</script>
