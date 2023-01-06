<template>
  <div
    class="border rounded flex flex-row font-semibold bg-gray-50 border-gray-200 h-6 text-sm px-2 gap-x-1 items-center justify-center"
    :data-cy="`debug-runNumber-${props.status}`"
  >
    <SolidStatusIcon
      size="16"
      :status="ICON_MAP[props.status].type"
    />
    <span :class="runNumberColor">
      {{ `#${props.value}` }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CloudRunStatus } from '../generated/graphql'
import { SolidStatusIcon, StatusType } from '@cypress-design/vue-statusicon'

const props = defineProps<{
  status: CloudRunStatus
  value: number
}>()

const ICON_MAP: Record<CloudRunStatus, { textColor: string, type: StatusType }> = {
  PASSED: { textColor: 'text-jade-400', type: 'passed' },
  FAILED: { textColor: 'text-red-400', type: 'failed' },
  CANCELLED: { textColor: 'text-gray-500', type: 'cancelled' },
  ERRORED: { textColor: 'text-orange-400', type: 'errored' },
  RUNNING: { textColor: 'text-indigo-500', type: 'running' },
  NOTESTS: { textColor: 'text-indigo-500', type: 'noTests' },
  OVERLIMIT: { textColor: 'text-indigo-500', type: 'overLimit' },
  TIMEDOUT: { textColor: 'text-indigo-500', type: 'timedOut' },
} as const

const runNumberColor = computed(() => {
  if (props.status) {
    return ICON_MAP[props.status].textColor
  }

  return ''
})

</script>
