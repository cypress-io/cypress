<template>
  <div class="flex h-6 text-gray-500 border border-gray-200 rounded text-size-14px leading-20px">
    <div
      v-for="(result, i) in results"
      :key="i"
      class="flex items-center px-2 hover:bg-indigo-50"
    >
      <component
        :is="result.icon"
        class="mr-1 h-12px w-12px"
        :class="result.color"
      />
      {{ result.value }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { RunResultsFragment } from '../generated/graphql'
import { gql } from '@urql/core'
import FlakyIcon from '~icons/cy/status-flaky_x12.svg'
import SkippedIcon from '~icons/cy/status-skipped_x12.svg'
import PassedIcon from '~icons/cy/status-passed_x12.svg'
import FailedIcon from '~icons/cy/status-failed_x12.svg'
import PendingIcon from '~icons/cy/status-pending_x12.svg'

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
    // TODO: Is flake even exposed via the API?
    // value: props.gql.totalFlaky,
    value: 0,
    color: 'icon-dark-gray-400',
    icon: FlakyIcon,
  },
  {
    value: props.gql.totalSkipped,
    color: 'icon-dark-gray-400',
    icon: SkippedIcon,
  },
  {
    value: props.gql.totalPending,
    color: 'icon-dark-gray-400 icon-light-white',
    icon: PendingIcon,
  },
  {
    value: props.gql.totalPassed,
    color: 'icon-dark-jade-400',
    icon: PassedIcon,
  },
  {
    value: props.gql.totalFailed,
    color: 'icon-dark-red-400',
    icon: FailedIcon,
  },
]
</script>
