<template>
  <div
    class="flex justify-center"
    data-cy="run-status-dots"
  >
    <ol
      class="list-none h-16px mb-0 pl-0 inline-block"
    >
      <li
        v-for="(dot,i) in dotClasses"
        :key="i"
        class="ml-4px inline-block align-middle"
      >
        <i-cy-dot-solid_x4
          width="4"
          height="4"
          :class="dot"
        />
      </li>
      <li class="ml-4px inline-block align-middle">
        <component
          :is="latestStatus.icon"
          width="16"
          height="16"
          :class="{'animate-spin': latestStatus.spin}"
        />
      </li>
    </ol>
  </div>
</template>

<script setup lang="ts">

import type { CloudRun } from '../../../graphql/src/gen/cloud-source-types.gen'
import { computed } from 'vue'
import CancelledIcon from '~icons/cy/cancelled-solid_x16.svg'
import ErroredIcon from '~icons/cy/errored-solid_x16.svg'
import FailedIcon from '~icons/cy/failed-solid_x16.svg'
import PassedIcon from '~icons/cy/passed-solid_x16.svg'
import PlaceholderIcon from '~icons/cy/placeholder-solid_x16.svg'
import RunningIcon from '~icons/cy/running-outline_x16.svg'

type Maybe<T> = T | null;

const props = withDefaults(defineProps<{
  runs: Maybe<CloudRun>[]
}>(), { runs: () => [] })

const dotClasses = computed(() => {
  const statuses = ['placeholder', 'placeholder', 'placeholder']

  if (props.runs && props.runs.length > 0) {
    for (let i = 1; i < Math.min(props.runs.length, 4); i++) {
      statuses[i - 1] = props.runs[i]?.status ?? ''
    }
  }

  return statuses.reverse().map((s) => {
    switch (s) {
      case 'PASSED':
        return 'icon-light-jade-400'
      case 'RUNNING':
        return 'icon-light-indigo-400'
      case 'FAILED':
        return 'icon-light-red-400'
      case 'ERRORED':
      case 'OVERLIMIT':
      case 'TIMEDOUT':
        return 'icon-light-orange-400'
      case 'NOTESTS':
        return 'icon-light-gray-400'
      case 'CANCELLED':
      default:
        return 'icon-light-gray-300'
    }
  })
})

const latestStatus = computed(() => {
  if (props.runs == null || props.runs.length === 0 || props.runs[0] === null) {
    return { icon: PlaceholderIcon, spin: false }
  }

  switch (props.runs[0]?.status) {
    case 'PASSED':
      return { icon: PassedIcon, spin: false }
    case 'RUNNING':
      return { icon: RunningIcon, spin: true }
    case 'FAILED':
      return { icon: FailedIcon, spin: false }
    case 'ERRORED':
    case 'OVERLIMIT':
    case 'TIMEDOUT':
      return { icon: ErroredIcon, spin: false }
    case 'NOTESTS':
    case 'CANCELLED':
      return { icon: CancelledIcon, spin: false }
    default:
      return { icon: PlaceholderIcon, spin: false }
  }
})

</script>

<style scoped>

</style>
