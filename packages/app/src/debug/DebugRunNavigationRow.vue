<template>
  <li
    class="mr-[12px] ml-[6px] "
    :data-cy="isCurrentRun ? 'current-run' : 'run'"
  >
    <component
      :is="isCurrentRun ? 'div': 'button'"
      :aria-label="t('debugPage.switchToRun', {runNumber: gql.runNumber})"
      class="rounded flex w-full p-[10px] pl-[35px] relative hocus:bg-indigo-50 focus:outline focus:outline-indigo-500"
      :class="{ 'bg-indigo-50': isCurrentRun }"
      @click="$emit('changeRun')"
    >
      <DebugCurrentRunIcon
        v-if="isCurrentRun"
        class="top-[18px] left-[12px] absolute"
        data-cy="current-run-check"
      />
      <div
        :data-cy="`run-${props.gql.runNumber}`"
        class="flex items-center justify-between w-full"
      >
        <div class="flex items-center min-w-0">
          <RunNumber
            v-if="props.gql.status && props.gql.runNumber"
            :status="props.gql.status"
            :value="props.gql.runNumber"
            class="mr-[8px]"
          />
          <RunResults
            v-if="props.gql"
            :gql="props.gql"
          />
          <Dot />
          <LightText class="truncate">
            {{ specsCompleted }}
          </LightText>
        </div>

        <LightText class="shrink-0 ml-[8px]">
          {{ totalDuration }} ({{ relativeCreatedAt }})
        </LightText>
      </div>
    </component>
  </li>
</template>

<script lang="ts" setup>
import { gql } from '@urql/vue'
import RunNumber from '../runs/RunNumber.vue'
import RunResults from '../runs/RunResults.vue'
import DebugCurrentRunIcon from './DebugCurrentRunIcon.vue'
import type { DebugProgress_DebugTestsFragment } from '../generated/graphql'
import { computed, FunctionalComponent, h } from 'vue'
import { useDebugRunSummary } from './useDebugRunSummary'
import { useRunDateTimeInterval } from './useRunDateTimeInterval'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

const props = defineProps<{
  gql: DebugProgress_DebugTestsFragment
  isCurrentRun: boolean
}>()

defineEmits<{
  (event: 'changeRun'): void
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
  ...RunResults
}`

const Dot: FunctionalComponent = () => {
  return h('span', { class: 'px-[8px] text-gray-300' }, '•')
}

useDebugRunSummary(props.gql)

const LightText: FunctionalComponent = (_props, { slots }) => {
  return h('span', { class: 'text-sm text-gray-700' }, slots?.default?.())
}

const run = computed(() => props.gql)

const { relativeCreatedAt, totalDuration } = useRunDateTimeInterval(run)

const specsCompleted = computed(() => {
  if (props.gql.status === 'RUNNING') {
    return t('debugPage.specCounts.whenRunning', { n: props.gql.totalInstanceCount || 0, completed: props.gql.completedInstanceCount || 0, total: props.gql.totalInstanceCount || 0 })
  }

  return t('debugPage.specCounts.whenCompleted', { n: props.gql.totalInstanceCount || 0 })
})
</script>
