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
          class="text-red-400 font-semibold text-sm flex items-center border-r-1px px-2"
        >
          <component
            :is="FailedSolidIcon"
            class="h-16px w-16px pr-2"
            data-cy="failed-prefix"
          />
          Failed
        </div>
      </template>
    </ResultCounts>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { DebugResultsFragment } from '../generated/graphql'
import { gql } from '@urql/core'
import FailedSolidIcon from '~icons/cy/status-failed-solid_x24.svg'
import ResultCounts from '@packages/frontend-shared/src/components/ResultCounts.vue'

// The query below will change to DebugResults
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

const defaultResults = {
  totalPassed: 1,
  totalFailed: 7,
  totalSkipped: 6,
  totalPending: 6,
}

const results = computed(() => {
  if (props.gql) {
    return props.gql
  }

  return defaultResults
})

</script>
