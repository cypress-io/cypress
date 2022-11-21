<template>
  <div
    class="flex gap-8px items-center"
    data-cy="debug-results-holder"
  >
    <ResultCounts
      :total-passed="results.totalPassed"
      :total-failed="results.totalFailed"
      :total-skipped="results.totalSkipped"
      :total-pending="results.totalPending"
      :order="['PASSED', 'FAILED', 'SKIPPED', 'PENDING']"
    >
      <template #prefix>
        <div
          class="text-red-400 font-semibold text-sm flex items-center px-2"
        >
          <component
            :is="icon[0]"
            class="h-16px w-16px pr-2"
            data-cy="icon-prefix"
          />
          {{ icon[1] }}
        </div>
        <div class="w-px h-3 my-6px bg-gray-100" />
      </template>
    </ResultCounts>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { DebugResultsFragment } from '../generated/graphql'
import { gql } from '@urql/core'
import FailedSolidIcon from '~icons/cy/status-failed-solid_x24.svg'
import PassedIcon from '~icons/cy/passed-solid_x16.svg'
import ResultCounts from '@packages/frontend-shared/src/components/ResultCounts.vue'

gql`
fragment DebugResults on CloudRun {
  id
  totalPassed
  totalFailed
  totalPending
  totalSkipped
  totalFlakyTests
}
`

const props = defineProps<{
  gql: DebugResultsFragment
}>()

const ICON_MAP = {
  PASSED: [PassedIcon, 'Passed'],
  FAILED: [FailedSolidIcon, 'Failed'],
} as const

const icon = computed(() => ICON_MAP['FAILED'])

const results = computed(() => props.gql)

</script>
