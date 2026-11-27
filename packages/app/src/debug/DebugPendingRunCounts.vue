<template>
  <span
    data-cy="debug-pending-counts"
    class="text-gray-600"
  >
    {{ specs?.completedSpecs || 0 }} of {{ specs?.totalSpecs || 0 }} {{ (specs?.totalSpecs || 0) === 1 ? 'spec' : 'specs' }} completed
  </span>
</template>

<script setup lang="ts">
import { gql } from '@urql/core'
import type { DebugPendingRunCountsFragment } from '../generated/graphql'

gql`
fragment DebugPendingRunCounts on CloudRun {
  id
  totalSpecs: totalInstanceCount
  completedSpecs: completedInstanceCount
}
`

defineProps<{
  specs: DebugPendingRunCountsFragment | undefined | null
}>()

</script>
