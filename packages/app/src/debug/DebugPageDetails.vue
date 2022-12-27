<template>
  <div
    class="flex flex-col w-full px-24px justify-center items-center align-middle"
    :class="{'flex-grow': ['PASSED', 'OVERLIMIT'].includes(status)}"
  >
    <DebugCancelledAlert
      v-if="status === 'CANCELLED'"
      :total-specs="totalSpecs"
      :total-skipped-specs="totalSkippedSpecs"
      :canceled-at="canceledAt"
      :canceled-by-full-name="canceledByFullName"
      :canceled-by-email="canceledByEmail"
    />
    <DebugPassed v-else-if="status === 'PASSED'" />
    <DebugErrored
      v-else-if="status === 'ERRORED'"
      :errors="errors"
      :total-specs="totalSpecs"
      :total-skipped-specs="totalSkippedSpecs"
    />
    <DebugNoTests v-else-if="status === 'NOTESTS'" />
    <DebugTimedout
      v-else-if="status === 'TIMEDOUT'"
      :total-specs="totalSpecs"
      :total-skipped-specs="totalSkippedSpecs"
      :ci="ci"
    />
    <DebugOverLimit
      v-else-if="status === 'OVERLIMIT' || isHiddenByUsageLimits"
      :over-limit-action-type="overLimitActionType"
      :over-limit-action-url="overLimitActionUrl"
    />
  </div>
</template>
<script lang="ts" setup>
import { computed } from '@vue/reactivity'
import type { CloudRunStatus, OverLimitActionTypeEnum } from '../generated/graphql'
import DebugCancelledAlert from './DebugCancelledAlert.vue'
import DebugPassed from './DebugPassed.vue'
import DebugErrored from './DebugErrored.vue'
import DebugNoTests from './DebugNoTests.vue'
import DebugTimedout from './DebugTimedout.vue'
import DebugOverLimit from './DebugOverLimit.vue'
import type { CloudCiBuildInfo } from '@packages/data-context/src/gen/graphcache-config.gen'

const props = defineProps<{
  status: CloudRunStatus
  canceledAt: string | null
  canceledByFullName?: string | null
  canceledByEmail?: string | null
  isHiddenByUsageLimits: boolean
  overLimitActionType: OverLimitActionTypeEnum
  overLimitActionUrl: string
  specs: readonly any[]
  ci?: Partial<CloudCiBuildInfo>
  errors: readonly string[]
}>()

const totalSkippedSpecs = computed(() => {
  return props.specs.filter((spec) => spec.status === 'UNCLAIMED' || spec.status === 'RUNNING').length
})

const totalSpecs = computed(() => {
  return props.specs.length
})

</script>
