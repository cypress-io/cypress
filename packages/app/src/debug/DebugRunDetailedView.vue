<template>
  <div class="border rounded border-indigo-100">
    <div
      class="bg-indigo-50 p-12px"
      data-cy="debug-detailed-header"
    >
      <div
        class="flex items-center justify-between"
      >
        <div class="flex min-w-0 items-center">
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
            {{ t('debugPage.mostRecentRun') }}
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
            <span class="font-medium pl-16px truncate">{{ latest.commitInfo?.summary }}</span>
            <Dot />
            <span class="truncate">{{ specsCompleted(latest) }}</span>
          </template>
        </div>
        <Button
          v-if="!latestIsCurrentlySelected"
          data-cy="switch-to-latest"
          class="flex-shrink-0"
          @click="$event => changeRun(latest!)"
        >
          Switch to latest run
        </Button>
      </div>
    </div>

    <div
      v-if="showRuns"
      class="max-h-30vh overflow-y-scroll"
    >
      <ul
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
            <span class="font-medium">
              {{ groupByCommit[sha][0]?.commitInfo?.summary }}
            </span>
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
  </div>
</template>

<script lang="ts" setup>
import { gql, useMutation } from '@urql/vue'
import DebugProgress from './DebugProgress.vue'
import Button from '@packages/frontend-shared/src/components/Button.vue'
import { groupBy } from 'lodash'
import { computed, FunctionalComponent, h, ref } from 'vue'
import { DebugRunDetailedViewFragment, DebugRunDetailedRunInfoFragment, DebugRunDetailedView_MoveToRunDocument } from '../generated/graphql'
import DebugResults from './DebugResults.vue'
import DebugRunNumber from './DebugRunNumber.vue'
import DebugCommitIcon from './DebugCommitIcon.vue'
import { IconChevronRightLarge } from '@cypress-design/vue-icon'
import { useDebugRunSummary } from './useDebugRunSummary'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

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

gql`
mutation DebugRunDetailedView_moveToRun($runNumber: Int!) {
  moveToRelevantRun(runNumber: $runNumber)
}
`

const props = defineProps<{
  runs: NonNullable<DebugRunDetailedViewFragment['allRuns']>
  currentRunNumber: number
}>()

const Dot: FunctionalComponent = () => {
  return h('span', { class: 'px-8px text-gray-300' }, '•')
}

const LightText: FunctionalComponent = (_props, { slots }) => {
  return h('span', { class: 'text-sm text-gray-700' }, slots?.default?.())
}

const moveToNewRun = useMutation(DebugRunDetailedView_MoveToRunDocument)

const showRuns = ref(false)

const latest = computed(() => props.runs[0])

useDebugRunSummary(latest)

const current = computed(() => {
  return props.runs?.find((run) => run?.runNumber === props.currentRunNumber)
})

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

  moveToNewRun.executeMutation({ runNumber: run.runNumber })
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
