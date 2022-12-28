<template>
  <div
    class="flex flex-col w-full px-24px justify-center items-center align-middle"
    :class="{'flex-grow': ['PASSED', 'OVERLIMIT'].includes(status)}"
  >
    <DebugCancelledAlert
      v-if="status === 'CANCELLED'"
      :total-specs="specs.length"
      :total-skipped-specs="totalSkippedSpecs"
      :cancelled-at="cancelledAt"
      :cancelled-by-full-name="cancelledByFullName"
      :cancelled-by-email="cancelledByEmail"
    />
    <DebugPassed v-else-if="status === 'PASSED'" />
    <DebugErrored
      v-else-if="status === 'ERRORED'"
      :errors="errors"
      :total-specs="specs.length"
      :total-skipped-specs="totalSkippedSpecs"
    />
    <DebugNoTests v-else-if="status === 'NOTESTS'" />
    <DebugTimedout
      v-else-if="status === 'TIMEDOUT'"
      :total-specs="specs.length"
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
import { gql } from '@urql/vue'
import type { CloudRunStatus, OverLimitActionTypeEnum, DebugSpecListSpecFragment, CloudCiBuildInfoFragment } from '../generated/graphql'
import DebugCancelledAlert from './DebugCancelledAlert.vue'
import DebugPassed from './DebugPassed.vue'
import DebugErrored from './DebugErrored.vue'
import DebugNoTests from './DebugNoTests.vue'
import DebugTimedout from './DebugTimedout.vue'
import DebugOverLimit from './DebugOverLimit.vue'

gql`
fragment CloudCiBuildInfo on CloudCiBuildInfo {
  id
  ciBuildNumberFormatted
  formattedProvider
  url
}
`

const props = defineProps<{
  status: CloudRunStatus
  cancelledAt: string | null
  cancelledByFullName?: string | null
  cancelledByEmail?: string | null
  isHiddenByUsageLimits: boolean
  overLimitActionType: OverLimitActionTypeEnum
  overLimitActionUrl: string
  specs: readonly DebugSpecListSpecFragment[]
  ci?: CloudCiBuildInfoFragment
  errors: readonly string[]
}>()

const totalSkippedSpecs = computed(() => {
  return props.specs.filter((spec) => spec.status === 'UNCLAIMED' || spec.status === 'RUNNING').length
})

</script>
