<template>
  <div
    data-cy="debug-testing-progress"
    class="border rounded border-gray-100 relative overflow-hidden"
  >
    <div class="flex text-md py-[14px] px-[16px] text-gray-900">
      <div
        data-cy="title"
        class="font-medium"
      >
        <span v-if="timeRemaining">
          Scheduled to complete in {{ timeRemaining }}
        </span>
        <span v-else-if="scheduledCompletionExpired">
          Scheduled to complete soon
        </span>
        <span v-else>
          Testing in progress...
        </span>
      </div>
      <div class="font-normal before-dot">
        <DebugPendingRunCounts
          :specs="run"
        />
      </div>
    </div>
    <div class=" bg-gray-50 h-[4px] w-full bottom-0 absolute">
      <div
        data-cy="progress"
        class=" bg-indigo-600 h-[4px] transition-all duration-500"
        :style="{ width: specCompletion + '%'}"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { gql } from '@urql/core'
import DebugPendingRunCounts from './DebugPendingRunCounts.vue'
import { DebugTestingProgress_SpecsDocument } from '../generated/graphql'
import { computed, ref, watch } from 'vue'
import { dayjs } from '../runs/utils/day.js'
import { useIntervalFn } from '@vueuse/core'
import { useSubscription } from '../graphql'

gql`
subscription DebugTestingProgress_Specs($id: ID!) {
  relevantRunSpecChange(runId: $id) {
    id
    ...DebugPendingRunCounts
    scheduledToCompleteAt
  }
}
`

const props = defineProps<{
  runId: string
}>()

const specs = useSubscription({ query: DebugTestingProgress_SpecsDocument, variables: { id: props.runId } })

const run = computed(() => {
  return specs.data.value?.relevantRunSpecChange
})

const specCompletion = computed(() => {
  if (run.value && run.value.totalSpecs && run.value.completedSpecs) {
    return run.value.completedSpecs / run.value.totalSpecs * 100
  }

  return 0
})

const timeRemaining = ref()
const scheduledCompletionExpired = ref(false)

const remainingInterval = useIntervalFn(() => {
  const scheduledToCompleteAt = run.value?.scheduledToCompleteAt

  if (scheduledToCompleteAt) {
    const durationRemaining = dayjs(scheduledToCompleteAt).diff(dayjs())

    timeRemaining.value = dayjs.duration(durationRemaining)
    .format('H[h] m[m] s[s]')
    .replace(/^0h /, '')
    .replace(/^0m /, '')

    if (durationRemaining <= 0) {
      scheduledCompletionExpired.value = true
      timeRemaining.value = undefined
      remainingInterval.pause()
    }
  }
}, 1000, {
  immediate: false,
  immediateCallback: true,
})

watch([() => {
  return run.value?.scheduledToCompleteAt
}], ([scheduledToCompleteAt]) => {
  scheduledCompletionExpired.value = false

  if (scheduledToCompleteAt) {
    remainingInterval.resume()
  } else {
    remainingInterval.pause()
  }
})

</script>

<style scoped>
.before-dot:before {
  content: '•';
  @apply text-gray-400 px-[8px]
}
</style>
