<template>
  <div class="border rounded flex border-gray-200 h-6 text-gray-500 text-size-14px leading-20px">
    <div
      v-for="(result, i) in results"
      :key="i"
      class="flex px-2 items-center hover:bg-indigo-50"
      :title="result.name"
    >
      <component
        :is="result.icon"
        class="h-12px mr-1 w-12px"
        :class="result.class"
      />
      <span class="sr-only">{{ result.name }}</span>
      {{ result.value }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { RunResultsFragment } from '../generated/graphql'
import { gql } from '@urql/core'
import SkippedIcon from '~icons/cy/status-skipped_x12.svg'
import PassedIcon from '~icons/cy/status-passed_x12.svg'
import FailedIcon from '~icons/cy/status-failed_x12.svg'
import PendingIcon from '~icons/cy/status-pending_x12.svg'
import { useI18n } from '@cy/i18n'
const { t } = useI18n()

gql`
fragment RunResults on CloudRun {
  id
  totalPassed
  totalFailed
  totalPending
  totalSkipped
}
`

const props = defineProps<{
	gql: RunResultsFragment
}>()

const results = [
  {
    value: props.gql.totalSkipped,
    class: 'icon-dark-gray-400',
    icon: SkippedIcon,
    name: t('runs.results.skipped'),
  },
  {
    value: props.gql.totalPending,
    class: 'icon-dark-gray-400 icon-light-white',
    icon: PendingIcon,
    name: t('runs.results.pending'),
  },
  {
    value: props.gql.totalPassed,
    class: 'icon-dark-jade-400',
    icon: PassedIcon,
    name: t('runs.results.passed'),
  },
  {
    value: props.gql.totalFailed,
    class: 'icon-dark-red-400',
    icon: FailedIcon,
    name: t('runs.results.failed'),
  },
]
</script>
