<template>
  <div class="border rounded border-indigo-100">
    <div
      class="flex bg-indigo-50 p-12px items-center"
      data-cy="debug-detailed-header"
    >
      <div
        class="flex w-full items-center justify-between"
      >
        <div class="flex items-center">
          <button
            class="flex mr-8px p-6px items-center"
            data-cy="debug-toggle"
            @click="toggleRuns"
          >
            <IconChevronRightLarge
              class="transition"
              :class="{'transform rotate-90': showRuns}"
              stroke-color="indigo-400"
            />
          </button>

          <LightText v-if="latestIsCurrentlySelected">
            You are on the most recent run
          </LightText>

          <template v-else-if="latest?.status && latest.runNumber">
            <DebugRunNumber
              :status="latest.status"
              :value="latest.runNumber"
              class="mr-8px"
            />
            <DebugResults
              v-if="latest"
              :gql="latest"
            />
            <span class="pl-16px">{{ latest.commitInfo?.summary }}</span>
            <Dot />{{ specsCompleted(latest) }}
          </template>
        </div>
        <Button
          v-if="!latestIsCurrentlySelected"
          data-cy="switch-to-latest"
          @click="$event => changeRun(latest!)"
        >
          Switch to latest run
        </Button>
      </div>
    </div>

    <ul
      v-if="showRuns"
      class="my-8px relative before:(content-DEFAULT top-20px bottom-10px w-5px border-2 border-dashed border-l-0 border-y-0 border-r-gray-100 left-[15px] absolute) "
      data-cy="debug-historical-runs"
    >
      <li
        v-for="sha of Object.keys(groupByCommit)"
        :key="sha"
        class="relative"
        :data-cy="`commit-${sha}`"
      >
        <div class="flex ml-12px py-10px items-center">
          <DebugCommitIcon />
          <LightText class="ml-16px">
            {{ sha.slice(0, 7) }}
          </LightText>
          <Dot />
          {{ groupByCommit[sha][0]?.commitInfo?.summary }}
        </div>

        <ul>
          <DebugProgress
            v-for="run of groupByCommit[sha]"
            :key="run?.runNumber!"
            :run-number="run?.runNumber!"
            :is-current-run="isCurrentRun(run!)"
            :gql="run!"
            @click="$event => changeRun(run!)"
          />
        </ul>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { gql } from '@urql/vue'
import DebugProgress from './DebugProgress.vue'
import Button from '@packages/frontend-shared/src/components/Button.vue'
import { groupBy } from 'lodash'
import { computed, FunctionalComponent, h, ref } from 'vue'
import type { DebugRunDetailedViewFragment, DebugRunDetailedRunInfoFragment } from '../generated/graphql'
import DebugResults from './DebugResults.vue'
import DebugRunNumber from './DebugRunNumber.vue'
import DebugCommitIcon from './DebugCommitIcon.vue'
import { IconChevronRightLarge } from '@cypress-design/vue-icon'
import { useDebugStore } from '../store/debug-store'
import { useDebugRunSummary } from './useDebugRunSummary'

gql`
fragment DebugRunDetailedRunInfo on CloudRun {
  ...DebugResults
  ...DebugProgress_DebugTests
  __typename
  runNumber
  totalTests
  totalFailed
  totalPassed
  totalPending
  totalSkipped
  totalDuration
  totalFlakyTests
  totalInstanceCount
  completedInstanceCount
  id
  status
  specs {
    id
    path
  }
  createdAt
  commitInfo {
    sha
    summary
  }
}
`

gql`
fragment DebugRunDetailedView on CloudProject {
  id
  allRuns: runsByCommitShas(commitShas: $commitShas) {
    id
    ...DebugRunDetailedRunInfo
  }
}
`

const props = defineProps<{
  runs: NonNullable<DebugRunDetailedViewFragment['allRuns']>
}>()

const Dot: FunctionalComponent = () => {
  return h('span', { class: 'px-8px' }, '•')
}

const LightText: FunctionalComponent = (_props, { slots }) => {
  return h('span', { class: 'text-sm text-gray-700' }, slots?.default?.())
}

const showRuns = ref(false)

const latest = computed(() => props.runs[0])

useDebugRunSummary(latest)

const current = computed(() => {
  return props.runs?.find((x) => x?.runNumber === debugStore.selectedRun?.runNumber)
})

const debugStore = useDebugStore()

const latestIsCurrentlySelected = computed(() => {
  return latest.value?.runNumber === current.value?.runNumber
})

const groupByCommit = computed(() => {
  return groupBy(props.runs, (run) => {
    return run?.commitInfo?.sha
  })
})

function changeRun (run: DebugRunDetailedRunInfoFragment) {
  if (!run.runNumber || !run.commitInfo?.sha) {
    return
  }

  debugStore.setSelectedRun({
    runNumber: run.runNumber!,
    sha: run.commitInfo?.sha!,
  })
}

function toggleRuns () {
  showRuns.value = !showRuns.value
}

function isCurrentRun (run: DebugRunDetailedRunInfoFragment) {
  return run.runNumber === current.value?.runNumber
}

function specsCompleted (run: DebugRunDetailedRunInfoFragment) {
  if (run.status === 'RUNNING') {
    return `${run.completedInstanceCount} of ${run.totalInstanceCount} specs completed`
  }

  return `${run.completedInstanceCount} specs`
}
</script>
