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
          {{ t('debugPage.pending.scheduledSeconds', {time: timeRemaining}) }}
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
        class=" bg-indigo-600 h-4px"
        :style="{ width: specCompletion + '%'} "
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { gql } from '@urql/core'
import { useI18n } from 'vue-i18n'
import DebugPendingRunCounts from './DebugPendingRunCounts.vue'
import { DebugTestingProgress_SpecsDocument } from '../generated/graphql'
import { useSubscription } from '@urql/vue'
import { computed, ref, watch } from 'vue'
import dayjs from 'dayjs'

gql`
subscription DebugTestingProgress_Specs {
  relevantRunSpecChange {
    currentProject {
      id
      relevantRunSpecs {
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

watch([() => {
  return specs.data.value?.relevantRunSpecChange?.currentProject?.relevantRunSpecs?.current?.scheduledToCompleteAt
}], ([scheduledToCompleteAt]) => {
  let timerId

  scheduledCompletionExpired.value = false

  if (timerId) {
    clearInterval(timerId)
  }

  if (scheduledToCompleteAt) {
    timerId = setInterval(() => {
      timeRemaining.value = dayjs(scheduledToCompleteAt).diff(dayjs(), 's')
      if (timeRemaining.value <= 0) {
        scheduledCompletionExpired.value = true
        if (timerId) {
          clearInterval(timerId)
        }
      }
    }, 1000)
  }
})

</script>

<style scoped>
.before-dot:before {
  content: '•';
  @apply text-gray-400 px-8px
}
</style>
