<template>
  <li
    class="rounded cursor-pointer flex mr-12px ml-6px p-10px pl-30px relative hocus:bg-indigo-50"
    :class="{ 'bg-indigo-50': isCurrentRun }"
    :data-cy="isCurrentRun ? 'current-run' : 'run'"
  >
    <DebugCurrentRunIcon
      class="top-[18px] left-[10px] absolute"
      data-cy="current-run-check"
    />
    <div
      :data-cy="`run-${runNumber}`"
      class="flex w-full justify-between"
    >
      <div class="flex">
        <DebugRunNumber
          v-if="data?.status"
          :status="data?.status"
          :value="runNumber"
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
        {{ formatDuration(props.gql?.totalDuration ?? 0) }} ({{ formatCreatedAt(props.gql?.createdAt ?? '') }})
      </LightText>
    </div>
  <!-- <div>{{ data?.completedSpecs }} out of {{ data?.totalSpecs }}</div> -->
  </li>
</template>

<script lang="ts" setup>
import { gql } from '@urql/vue'
import { useSubscription } from '../graphql'
import DebugCurrentRunIcon from './DebugCurrentRunIcon.vue'
import { DebugProgress_SpecsDocument, DebugProgress_DebugTestsFragment } from '../generated/graphql'
import { formatDuration, formatCreatedAt } from './utils/formatTime'
import { watch, watchEffect, computed, ref } from 'vue'
import DebugResults from './DebugResults.vue'

const props = defineProps<{
  gql?: DebugProgress_DebugTestsFragment
  runNumber: number
  isCurrentRun: boolean
}>()

gql`
fragment DebugProgress_DebugTests on CloudRun {
  id
  totalDuration
  createdAt
  ...DebugResults
}`

gql`
subscription DebugProgress_Specs($runNumber: Int!) {
  relevantRunSpecChange {
    currentProject {
      id
      relevantRunSpecs (runNumber: $runNumber) {
        current {
          totalSpecs
          completedSpecs
          scheduledToCompleteAt
          status
        }
      }
    }
  }
}
`

const shouldPause = ref(false)

const specs = useSubscription({
  query: DebugProgress_SpecsDocument,
  variables: {
    runNumber: props.runNumber,
  },
  pause: shouldPause,
})

const data = computed(() => specs.data.value?.relevantRunSpecChange?.currentProject?.relevantRunSpecs?.current)

watch(specs.data, (val) => {
  /* eslint-disable no-console */
  console.log(`Subscribed for ${props.runNumber} -> got data`, val)
})

// We pause the subscription if status is anything but RUNNING
watchEffect(() => {
  const status = specs.data.value?.relevantRunSpecChange?.currentProject?.relevantRunSpecs?.current?.status

  if (status && status !== 'RUNNING') {
    shouldPause.value = true
  }
})

const specsCompleted = computed(() => {
  if (!data.value?.status || !data.value.completedSpecs || !data.value.totalSpecs) {
    return
  }

  if (data.value.status === 'RUNNING') {
    return `${data.value?.completedSpecs} of ${data.value.totalSpecs} specs completed`
  }

  return `${data.value.completedSpecs} specs`
})
</script>
