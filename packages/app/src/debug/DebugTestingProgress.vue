<template>
  <div
    data-cy="debug-testing-progress"
    class="border rounded border-gray-100 relative overflow-hidden"
  >
    <div class="flex text-md py-14px px-16px text-gray-900">
      <div
        data-cy="title"
        class="font-medium"
      >
        <span v-if="timeRemaining">
          {{ t('debugPage.pending.scheduledTime', {time: timeRemaining}) }}
        </span>
        <span v-else-if="scheduledCompletionExpired">
          {{ t('debugPage.pending.scheduledCompletionExpired') }}
        </span>
        <span v-else>
          {{ t('debugPage.pending.title') }}
        </span>
      </div>
      <div class="font-normal before-dot">
        <DebugPendingRunCounts
          :specs="specCounts"
        />
      </div>
    </div>
    <div class=" bg-gray-50 h-4px w-full bottom-0 absolute">
      <div
        data-cy="progress"
        class=" bg-indigo-600 h-4px transition-all duration-500"
        :style="{ width: specCompletion + '%'}"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { gql } from '@urql/core'
import { useI18n } from 'vue-i18n'
import DebugPendingRunCounts from './DebugPendingRunCounts.vue'
import { DebugTestingProgress_SpecsDocument } from '../generated/graphql'
import { computed, ref, watch } from 'vue'
import { dayjs } from '../runs/utils/day.js'
import { useIntervalFn } from '@vueuse/core'
import { useSubscription } from '../graphql'

gql`
subscription DebugTestingProgress_Specs($runNumber: Int!) {
  relevantRunSpecChange {
    currentProject {
      id
      relevantRunSpecs (runNumber: $runNumber) {
        current {
          ...DebugPendingRunCounts
          scheduledToCompleteAt
        }
      }
    }
  }
}
`

const { t } = useI18n()

const specs = useSubscription({ query: DebugTestingProgress_SpecsDocument })

const specCounts = computed(() => {
  return specs.data.value?.relevantRunSpecChange?.currentProject?.relevantRunSpecs?.current
})

const specCompletion = computed(() => {
  if (specCounts.value && specCounts.value.totalSpecs && specCounts.value.completedSpecs) {
    return specCounts.value.completedSpecs / specCounts.value.totalSpecs * 100
  }

  return 0
})

const timeRemaining = ref()
const scheduledCompletionExpired = ref(false)

const remainingInterval = useIntervalFn(() => {
  const scheduledToCompleteAt = specs.data.value?.relevantRunSpecChange?.currentProject?.relevantRunSpecs?.current?.scheduledToCompleteAt

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
  return specs.data.value?.relevantRunSpecChange?.currentProject?.relevantRunSpecs?.current?.scheduledToCompleteAt
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
  @apply text-gray-400 px-8px
}
</style>
