<template>
  <div
    v-if="props.run"
    class="flex flex-col gap-2 items-center"
  >
    <div class="font-semibold text-gray-800">
      Run #{{ props.run.runNumber }}
    </div>
    <div class="max-w-80 text-gray-600 truncate overflow-hidden">
      {{ props.specFile }}
    </div>
    <RunResults
      v-if="runResults"
      v-bind="runResults"
    />
    <div class="flex flex-row text-gray-600 text-size-14px gap-2 items-center">
      <div>{{ getAggDurationString(props.run.specDuration ?? {}) }}</div>
      <i-cy-dot-solid_x4
        width="4px"
        height="4px"
        class="icon-light-gray-400"
      />
      <div>{{ groupText }}</div>
      <i-cy-dot-solid_x4
        width="4px"
        height="4px"
        class="icon-light-gray-400"
      />
      <div v-if="props.run.createdAt">
        {{ getTimeAgo(props.run.createdAt!) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

import { computed } from 'vue'
import type { CloudSpecRun, SpecDataAggregate } from '../../../graphql/src/gen/cloud-source-types.gen'
import RunResults, { RunResultProps } from '../runs/RunResults.vue'
import { getTimeAgo, getDurationString } from '@packages/frontend-shared/src/utils/time'

const props = withDefaults(defineProps<{
  run: CloudSpecRun|null
  specFile: string|null
}>(), {
  run: null,
  specFile: null,
})

const getAggregateTestCountString = (agg: SpecDataAggregate) => {
  if (agg.min == null) return '--'

  if (!agg.max || agg.min === agg.max) return agg.min!

  return `${agg.min}-${agg.max}`
}

const getAggDurationString = (agg: SpecDataAggregate) => {
  if (agg.min == null) return '--'

  if (!agg.max || Math.round(agg.min) === Math.round(agg.max)) return getDurationString(agg.min)

  return `${getDurationString(agg.min)} - ${getDurationString(agg.max)}`
}

const runResults = computed(() => {
  if (!props.run) return null

  return {
    id: props.run.id,
    totalFailed: getAggregateTestCountString(props.run.testsFailed ?? {}),
    totalPassed: getAggregateTestCountString(props.run.testsPassed ?? {}),
    totalPending: getAggregateTestCountString(props.run.testsPending ?? {}),
    totalSkipped: getAggregateTestCountString(props.run.testsSkipped ?? {}),
  } as RunResultProps
})

const groupText = computed(() => {
  if (!props.run) return null

  if (props.run.groupCount === 1) return '1 group'

  return `${props.run.groupCount } groups`
})

</script>
