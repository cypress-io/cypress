<template>
  <div class="flex gap-8px items-center">
    <ResultCounts
      :total-passed="1"
      :total-failed="7"
      :total-skipped="6"
      :total-pending="6"
      :order="['PASSED', 'FAILED', 'SKIPPED', 'PENDING']"
    >
      <template #prefix>
        <div
          class="text-red-400 font-semibold text-sm flex items-center border-r-1px px-2"
        >
          <component
            :is="FailedSolidIcon"
            class="h-16px w-16px pr-2"
          />
          Failed
        </div>
      </template>
    </ResultCounts>
  </div>
</template>

<script lang="ts" setup>
// import type { DebugResultsFragment } from '../generated/graphql'
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
// const props = defineProps<{
//   gql: DebugResultsFragment
// }>()

</script>
