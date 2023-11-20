<template>
  <div
    v-if="props.run"
    class="flex flex-col p-4 gap-2 items-center"
    :class="highlightColor"
    data-cy="spec-run-summary"
  >
    <SpecNameDisplay
      :spec-file-name="props.specFileNoExtension"
      :spec-file-extension="props.specFileExtension"
    />
    <div class="flex flex-row text-gray-700 text-[14px] gap-2 items-center">
      <div
        v-if="statusText"
        :class="'text-'+statusTextColor"
        class="font-medium"
        data-cy="spec-run-status"
      >
        {{ statusText }}
      </div>
      <i-cy-dot-solid_x4
        v-if="statusText"
        width="4px"
        height="4px"
        class="icon-light-gray-200"
      />
      <div
        v-if="props.run.createdAt"
        data-cy="spec-run-time-ago"
      >
        {{ getTimeAgo(props.run.createdAt) }}
      </div>
      <i-cy-dot-solid_x4
        width="4px"
        height="4px"
        class="icon-light-gray-200"
      />
      <div data-cy="spec-run-duration-1">
        {{ durationText1 }}
      </div>
      <div
        v-if="durationText2"
        class="m-[-5px] text-gray-200"
      >
        -
      </div>
      <div
        v-if="durationText2"
        data-cy="spec-run-duration-2"
      >
        {{ durationText2 }}
      </div>
    </div>
    <ResultCounts
      v-if="runResults"
      v-bind="runResults"
      class="my-2"
      data-cy="spec-run-result-counts"
    />
  </div>
</template>

<script setup lang="ts">

import { computed } from 'vue'
import type { CloudSpecRun, SpecDataAggregate } from '../../../graphql/src/gen/cloud-source-types.gen'
import ResultCounts, { ResultCountsProps } from '@packages/frontend-shared/src/components/ResultCounts.vue'
import { getTimeAgo, getDurationString } from '@packages/frontend-shared/src/utils/time'
import SpecNameDisplay from './SpecNameDisplay.vue'

const props = defineProps<{
  run: CloudSpecRun
  specFileNoExtension: string
  specFileExtension: string
}>()

const getAggregateTestCountString = (agg: SpecDataAggregate) => {
  if (agg.min == null) return '0'

  if (!agg.max || agg.min === agg.max) return agg.min

  return `${agg.min}-${agg.max}`
}

const durationText1 = computed(() => {
  if (props.run?.specDuration?.min == null) return '--'

  return getDurationString(props.run?.specDuration?.min)
})

const durationText2 = computed(() => {
  if (props.run?.specDuration?.min == null) return null

  // since props.run?.specDuration?.min and props.run?.specDuration?.max are in milliseconds, we want to make sure the
  // user won't get a string like "2 - 2" for {min: 2003, max: 2010}
  if (!props.run?.specDuration?.max || Math.round(props.run?.specDuration?.min / 1000) === Math.round(props.run?.specDuration?.max / 1000)) return null

  return getDurationString(props.run?.specDuration?.max)
})

const runResults = computed(() => {
  if (!props.run) return null

  return {
    id: props.run.id,
    totalFailed: getAggregateTestCountString(props.run.testsFailed ?? {}),
    totalPassed: getAggregateTestCountString(props.run.testsPassed ?? {}),
    totalPending: getAggregateTestCountString(props.run.testsPending ?? {}),
    totalSkipped: getAggregateTestCountString(props.run.testsSkipped ?? {}),
  } as ResultCountsProps
})

const statusText = computed(() => {
  if (!props.run?.status) return null

  switch (props.run.status) {
    case 'CANCELLED': return 'Canceled'
    case 'ERRORED': return 'Errored'
    case 'FAILED': return 'Failed'
    case 'NOTESTS': return 'No tests'
    case 'PASSED': return 'Passed'
    case 'UNCLAIMED': return 'Queued'
    case 'RUNNING': return 'Running'
    case 'TIMEDOUT': return 'Timed out'
    default: return null
  }
})

const statusColor = computed(() => {
  if (!props.run?.status) return 'gray'

  switch (props.run.status) {
    case 'ERRORED':
    case 'TIMEDOUT':
      return 'orange'
    case 'FAILED':
      return 'red'
    case 'PASSED':
      return 'jade'
    case 'RUNNING':
      return 'indigo'
    case 'CANCELLED':
    case 'NOTESTS':
    case 'UNCLAIMED':
    default: return 'gray'
  }
})

const highlightColor = computed(() => {
  const color = statusColor.value

  if (color === 'gray') return 'gray-500'

  return `${color}-400`
})

const statusTextColor = computed(() => {
  const color = statusColor.value

  if (color === 'gray') return 'gray-700'

  return `${color}-500`
})

</script>

<style lang="scss" scoped>
.orange-400 {
    border-top: 4px solid $orange-400 !important;
}
.red-400 {
    border-top: 4px solid $red-400 !important;
}
.jade-400 {
    border-top: 4px solid $jade-400 !important;
}
.indigo-400 {
    border-top: 4px solid $indigo-400 !important;
}
.gray-500 {
    border-top: 4px solid $gray-500 !important;
}
</style>
