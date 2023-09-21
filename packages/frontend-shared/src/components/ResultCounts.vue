<template>
  <div class="bg-white border rounded flex border-gray-200 h-6 text-gray-700 text-[14px] leading-[20px]">
    <div
      v-for="(result, i) in results"
      :key="i"
      class="flex px-2 items-center"
      :title="result.name"
      :data-cy="`runResults-${result.name}-count`"
    >
      <component
        :is="result.icon"
        class="mt-px h-[12px] mr-1 w-[12px]"
        :class="result.class"
        aria-hidden="true"
      />
      <span
        class="sr-only"
      >{{ result.name }}</span>
      {{ result.value }}
    </div>
  </div>
</template>

<script lang="ts" setup>

export interface ResultCountsProps {
  totalPassed?: number | string | null
  totalFailed?: number | string | null
  totalPending?: number | string | null
  totalSkipped?: number | string | null
  order?: string[]
}

import { computed, FunctionalComponent, SVGAttributes } from 'vue'
import SkippedIcon from '~icons/cy/status-skipped_x12.svg'
import PassedIcon from '~icons/cy/status-passed_x12.svg'
import FailedIcon from '~icons/cy/status-failed_x12.svg'
import PendingIcon from '~icons/cy/status-pending_x12.svg'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

const props = defineProps<ResultCountsProps>()

type CountType= 'SKIPPED' | 'PENDING' | 'PASSED' | 'FAILED'

interface Status {
  value: number | string | null
  class: string
  icon: FunctionalComponent<SVGAttributes, {}>
  name: string
}

const ORDER_MAP = computed<Record<CountType, Status>>(() => {
  return {
    'SKIPPED': {
      value: props.totalSkipped!,
      class: 'icon-dark-gray-400',
      icon: SkippedIcon,
      name: t('runs.results.skipped'),
    },
    'PENDING': {
      value: props.totalPending!,
      class: 'icon-dark-gray-400 icon-light-white',
      icon: PendingIcon,
      name: t('runs.results.pending'),
    },
    'PASSED': {
      value: props.totalPassed!,
      class: 'icon-dark-jade-400',
      icon: PassedIcon,
      name: t('runs.results.passed'),
    },
    'FAILED': {
      value: props.totalFailed!,
      class: 'icon-dark-red-400',
      icon: FailedIcon,
      name: t('runs.results.failed'),
    },
  }
})

const results = computed(() => {
  const order = props.order || ['SKIPPED', 'PENDING', 'PASSED', 'FAILED']

  return order.map((status) => ORDER_MAP.value[status])
})

</script>
