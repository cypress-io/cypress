<template>
  <div
    data-cy="debug-pending-splash"
    class="space-around flex"
  >
    <div class="flex flex-col w-full items-center">
      <IconTechnologyDashboardRunning class="mb-16px" />
      <span
        data-cy="title"
        class="font-medium text-lg text-gray-900"
      >
        {{ t('debugPage.pending.title') }}
      </span>
      <div class="font-normal text-md">
        <DebugPendingRunCounts
          :spec-statuses="specStatuses"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { gql } from '@urql/core'
import { useI18n } from 'vue-i18n'
import { IconTechnologyDashboardRunning } from '@cypress-design/vue-icon'
import DebugPendingRunCounts from './DebugPendingRunCounts.vue'
import type { CloudSpecStatus } from '../generated/graphql'

gql`
fragment DebugPendingRunSplash on CloudRun {
  id
}
`

const { t } = useI18n()

defineProps<{
  specStatuses: CloudSpecStatus[]
}>()

</script>
