<template>
  <div
    class="border rounded flex flex-row font-semibold bg-gray-50 border-gray-200 h-6 text-sm px-2 gap-x-1 items-center justify-center"
    :class="hocusStyles"
    :data-cy="`runNumber-status-${props.status}`"
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
  isActionable?: boolean
}>()

const ICON_MAP: Record<CloudRunStatus, { textColor: string, type: StatusType, hocusStyles: readonly string[] }> = {
  PASSED: { textColor: 'text-jade-400', type: 'passed', hocusStyles: ['group-hover:border-jade-400', 'group-focus-visible:border-jade-400', 'group-focus-visible:outline-jade-400'] },
  FAILED: { textColor: 'text-red-400', type: 'failed', hocusStyles: ['group-hover:border-red-400', 'group-focus-visible:border-red-400', 'group-focus-visible:outline-red-400'] },
  CANCELLED: { textColor: 'text-gray-500', type: 'cancelled', hocusStyles: ['group-hover:border-gray-500', 'group-focus-visible:border-gray-500', 'group-focus-visible:outline-gray-500'] },
  ERRORED: { textColor: 'text-orange-400', type: 'errored', hocusStyles: ['group-hover:border-orange-400', 'group-focus-visible:border-orange-400', 'group-focus-visible:outline-orange-400'] },
  RUNNING: { textColor: 'text-indigo-500', type: 'running', hocusStyles: ['group-hover:border-indigo-500', 'group-focus-visible:border-indigo-500', 'group-focus-visible:outline-indigo-500'] },
  NOTESTS: { textColor: 'text-indigo-500', type: 'noTests', hocusStyles: ['group-hover:border-indigo-500', 'group-focus-visible:border-indigo-500', 'group-focus-visible:outline-indigo-500'] },
  OVERLIMIT: { textColor: 'text-indigo-500', type: 'overLimit', hocusStyles: ['group-hover:border-indigo-500', 'group-focus-visible:border-indigo-500', 'group-focus-visible:outline-indigo-500'] },
  TIMEDOUT: { textColor: 'text-indigo-500', type: 'timedOut', hocusStyles: ['group-hover:border-indigo-500', 'group-focus-visible:border-indigo-500', 'group-focus-visible:outline-indigo-500'] },
} as const

const icon = computed(() => {
  return ICON_MAP[props.status]
})

const runNumberColor = computed(() => {
  return icon.value.textColor
})

const hocusStyles = computed(() => {
  if (!props.isActionable) {
    return
  }

  return [
    'group-focus-visible:outline',
    ...icon.value.hocusStyles,
  ]
})

</script>
