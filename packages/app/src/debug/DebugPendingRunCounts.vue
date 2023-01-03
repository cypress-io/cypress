<template>
  <span
    data-cy="debug-pending-counts"
    class="text-gray-600"
  >
    {{ t('debugPage.pending.pendingCount', { n: totalTests, completed: totalCompleted, total: totalTests }) }}
  </span>
</template>

<script setup lang="ts">
import { gql } from '@urql/core'
import { computed } from '@vue/reactivity'
import { useI18n } from 'vue-i18n'
import type { CloudSpecStatus } from '../generated/graphql'

gql`
fragment DebugPendingRunCounts on CloudRun {
  id
  specs {
    id
    status
  }
}
`

const { t } = useI18n()

const props = defineProps<{
  specStatuses: CloudSpecStatus[]
}>()

const INCOMPLETE_STATUSES: CloudSpecStatus[] = ['RUNNING', 'UNCLAIMED']

const totalTests = computed(() => props.specStatuses.length)
const totalCompleted = computed(() => props.specStatuses.filter((status) => !INCOMPLETE_STATUSES.includes(status)).length)

</script>
