import type { CloudRun } from '@packages/frontend-shared/cypress/support/generated/test-graphql-types.gen'
import { useIntervalFn } from '@vueuse/core'
import dayjs from 'dayjs'
import { computed, Ref, ref, unref, watchEffect } from 'vue'
import { formatDuration, formatCreatedAt } from './utils/formatTime'

type RunDateTimeType = Pick<CloudRun, 'status' | 'createdAt' | 'totalDuration'>

/**
 * Handles formatting the `createdAt` and `totalDuration` fields from a run for display.
 *
 * Will set a 1 second interval to dynamically update the times when a run has a RUNNING status.
 *
 * @param maybeValuesRef that contains the fields needed to format the createdAt and totalDuration fields
 */
export function useRunDateTimeInterval (maybeValuesRef: Ref<RunDateTimeType> | RunDateTimeType) {
  const relativeCreatedAt = ref<string>()
  const totalDuration = ref<string>()

  const run = computed(() => unref(maybeValuesRef))

  const timeInterval = useIntervalFn(() => {
    totalDuration.value = formatDuration(dayjs().diff(dayjs(new Date(run.value.createdAt))))
    relativeCreatedAt.value = formatCreatedAt(run.value.createdAt)
  }, 1000, {
    immediate: false,
    immediateCallback: true,
  })

  watchEffect(() => {
    if (run.value.status === 'RUNNING') {
      timeInterval.resume()
    } else {
      timeInterval.pause()
      totalDuration.value = formatDuration(run.value.totalDuration ?? 0)
      relativeCreatedAt.value = formatCreatedAt(run.value.createdAt)
    }
  })

  return {
    relativeCreatedAt,
    totalDuration,
  }
}
