<template>
  <div class="flex gap-[8px] items-center">
    <span
      v-if="props.gql.totalFlakyTests"
      class="rounded-md font-semibold bg-warning-100 text-sm py-[2px] px-[4px] text-warning-600 whitespace-nowrap"
    >{{ props.gql.totalFlakyTests }} Flaky</span>
    <ResultCounts
      :total-failed="props.gql.totalFailed"
      :total-passed="props.gql.totalPassed"
      :total-pending="props.gql.totalPending"
      :total-skipped="props.gql.totalSkipped"
    />
  </div>
</template>

<script lang="ts" setup>
import type { RunResultsFragment } from '../generated/graphql'
import { gql } from '@urql/core'
import ResultCounts from '@packages/frontend-shared/src/components/ResultCounts.vue'

gql`
fragment RunResults on CloudRun {
  id
  totalPassed
  totalFailed
  totalPending
  totalSkipped
  totalFlakyTests
}
`

const props = defineProps<{
  gql: RunResultsFragment
}>()

</script>
