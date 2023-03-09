<template>
  <span
    data-cy="debug-pending-counts"
    class="text-gray-600"
  >
    {{ t('debugPage.pending.pendingCount', { n: specs?.totalSpecs || 0, completed: specs?.completedSpecs || 0, total: specs?.totalSpecs || 0 }) }}
  </span>
</template>

<script setup lang="ts">
import { gql } from '@urql/core'
import { useI18n } from 'vue-i18n'
import type { DebugPendingRunCountsFragment } from '../generated/graphql'

gql`
fragment DebugPendingRunCounts on RelevantRunSpecs {
  totalSpecs
  completedSpecs
}
`

const { t } = useI18n()

defineProps<{
  specs: DebugPendingRunCountsFragment | undefined | null
}>()

</script>
