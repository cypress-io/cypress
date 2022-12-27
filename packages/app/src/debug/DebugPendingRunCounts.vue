<template>
  <span
    data-cy="debug-pending-counts"
    class="text-gray-600"
  >
    {{ t('debugPage.pending.pendingCount', { completed: totalCompleted, total: totalTests }) }}
  </span>
</template>

<script setup lang="ts">
import { gql } from '@urql/core'
import { computed } from '@vue/reactivity'
import { useI18n } from 'vue-i18n'

gql`
fragment DebugPendingRunCounts on CloudRun {
  id
  totalSkipped
  totalPassed
  totalFailed
  totalTests
}
`

const { t } = useI18n()

const props = defineProps<{
  totalSkipped: number
  totalPassed: number
  totalFailed: number
  totalTests: number
}>()

const totalCompleted = computed(() => props.totalSkipped + props.totalFailed + props.totalPassed)

</script>
