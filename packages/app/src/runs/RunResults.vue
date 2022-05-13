<template>
  <ResultCounts v-bind="props.gql" />
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
}
`

const props = defineProps<{
  gql: RunResultsFragment
}>()

</script>
