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
          :specs="specCounts"
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
import { DebugPendingRunSplash_SpecsDocument } from '../generated/graphql'
import { useSubscription } from '@urql/vue'
import { computed } from 'vue'

gql`
subscription DebugPendingRunSplash_Specs {
  relevantRunSpecChange {
    currentProject {
      id
      relevantRunSpecs {
        current {
          ...DebugPendingRunCounts
        }
      }
    }
  }
}
`

const { t } = useI18n()

const specs = useSubscription({ query: DebugPendingRunSplash_SpecsDocument })

const specCounts = computed(() => {
  return specs.data.value?.relevantRunSpecChange?.currentProject?.relevantRunSpecs?.current
})

</script>
