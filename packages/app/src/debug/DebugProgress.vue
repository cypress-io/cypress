<template>
  <li
    class="rounded cursor-pointer flex mr-12px ml-6px p-10px pl-30px relative hocus:bg-indigo-50"
    :class="{ 'bg-indigo-50': isCurrentRun }"
    :data-cy="isCurrentRun ? 'current-run' : 'run'"
  >
    <DebugCurrentRunIcon
      v-if="isCurrentRun"
      class="top-[18px] left-[10px] absolute"
      data-cy="current-run-check"
    />
    <div
      :data-cy="`run-${props.gql.runNumber}`"
      class="flex w-full justify-between"
    >
      <div class="flex items-center">
        <DebugRunNumber
          v-if="props.gql.status && props.gql.runNumber"
          :status="props.gql.status"
          :value="props.gql.runNumber"
          class="mr-8px"
        />
        <DebugResults
          v-if="props.gql"
          :gql="props.gql"
          class="bg-white"
        />
        <Dot />
        <LightText>
          {{ specsCompleted }}
        </LightText>
      </div>

      <LightText>
        {{ totalDuration }} ({{ relativeCreatedAt }})
      </LightText>
    </div>
  </li>
</template>

<script lang="ts" setup>
import { gql } from '@urql/vue'
import DebugRunNumber from './DebugRunNumber.vue'
import DebugCurrentRunIcon from './DebugCurrentRunIcon.vue'
import type { DebugProgress_DebugTestsFragment } from '../generated/graphql'
import { computed, FunctionalComponent, h } from 'vue'
import DebugResults from './DebugResults.vue'
import { useDebugRunSummary } from './useDebugRunSummary'
import { useRunDateTimeInterval } from './useRunDateTimeInterval'

const props = defineProps<{
  gql: DebugProgress_DebugTestsFragment
  isCurrentRun: boolean
}>()

gql`
fragment DebugProgress_DebugTests on CloudRun {
  id
  runNumber
  totalDuration
  createdAt
  status
  completedInstanceCount
  totalInstanceCount
  ...DebugResults
}`

const Dot: FunctionalComponent = () => {
  return h('span', { class: 'px-8px text-gray-300' }, '•')
}

useDebugRunSummary(props.gql)

const LightText: FunctionalComponent = (_props, { slots }) => {
  return h('span', { class: 'text-sm text-gray-700' }, slots?.default?.())
}

const { relativeCreatedAt, totalDuration } = useRunDateTimeInterval(props.gql)

const specsCompleted = computed(() => {
  if (!props.gql.status || !props.gql.completedInstanceCount || !props.gql.totalInstanceCount) {
    return
  }

  if (props.gql.status === 'RUNNING') {
    return `${props.gql.completedInstanceCount} of ${props.gql.totalInstanceCount} specs completed`
  }

  return `${props.gql.completedInstanceCount} specs`
})
</script>
