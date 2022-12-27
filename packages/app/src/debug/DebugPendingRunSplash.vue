<template>
  <div
    data-cy="debug-pending-splash"
    class="space-around flex"
  >
    <div class="flex flex-col w-full items-center">
      <!-- TODO: Replace with 'running' version of icon once cypress-design is updated -->
      <IconTechnologyDashboardCheckmark class="mb-16px" />
      <span
        data-cy="title"
        class="font-medium text-lg text-gray-900"
      >
        {{ t('debugPage.pending.title') }}
      </span>
      <div class="font-normal text-md">
        <DebugPendingRunCounts
          :total-skipped="totalSkipped"
          :total-failed="totalFailed"
          :total-passed="totalPassed"
          :total-tests="totalTests"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { gql } from '@urql/core'
import { useI18n } from 'vue-i18n'
import { IconTechnologyDashboardCheckmark } from '@cypress-design/vue-icon'
import DebugPendingRunCounts from './DebugPendingRunCounts.vue'

gql`
fragment DebugPendingRunSplash on CloudRun {
  id
  ...DebugPendingRunCounts
}
`

const { t } = useI18n()

defineProps<{
  totalSkipped: number
  totalFailed: number
  totalPassed: number
  totalTests: number
}>()

</script>
