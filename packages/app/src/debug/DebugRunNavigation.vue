<template>
  <div
    v-if="shouldShow"
    class="border rounded border-indigo-100 overflow-hidden"
  >
    <div
      class="bg-indigo-50 p-12px group"
      data-cy="debug-detailed-header"
    >
      <div
        class="flex items-center justify-between"
      >
        <div class="flex min-w-0 items-center">
          <button
            v-if="!hideToggle"
            :aria-expanded="showRuns"
            aria-controls="debug-runs-container"
            class="border border-transparent rounded flex p-2px transition items-center hocus-default hover:bg-white focus:bg-white active:bg-white group-hover:(outline outline-indigo-100) "
            data-cy="debug-toggle"
            @click="toggleRuns()"
          >
            <IconChevronRightSmall
              class="transition"
              :class="{'transform rotate-90': showRuns}"
              stroke-color="indigo-400"
            />
            <span
              class="font-medium text-sm mr-4px ml-8px text-indigo-500"
              :class="{'sr-only': !latestIsCurrentlySelected}"
            >
              {{ t('debugPage.switchRun') }}
            </span>
          </button>

          <Dot v-if="latestIsCurrentlySelected" />
          <LightText v-if="latestIsCurrentlySelected">
            {{ t('debugPage.mostRecentRun') }}
          </LightText>

          <template v-else-if="latest?.status && latest.runNumber">
            <DebugRunNumber
              :status="latest.status"
              :value="latest.runNumber"
              class="mx-8px"
            />
            <DebugResults
              v-if="latest"
              :gql="latest"
              class="bg-white mr-12px"
            />
            <span
              class="font-medium text-gray-800 truncate"
              :title="latest.commitInfo?.summary!"
            >{{ latest.commitInfo?.summary }}</span>
            <Dot class="hidden lg:block" />
            <span class="flex-shrink-0 text-gray-700 truncate hidden lg:block">{{ specsCompleted(latest) }}</span>
          </template>
        </div>
        <Button
          v-if="!latestIsCurrentlySelected"
          data-cy="switch-to-latest"
          class="flex-shrink-0 ml-8px"
          @click="$event => changeRun(latest!)"
        >
          {{ t('debugPage.switchToLatestRun') }}
        </Button>
      </div>
    </div>

    <TransitionQuickFadeVue>
      <div v-if="showRuns">
        <div
          id="debug-runs-container"
          class="max-h-30vh overflow-y-scroll"
          data-cy="debug-runs-container"
        >
          <ul
            class="my-8px relative before:(content-DEFAULT top-20px bottom-10px w-5px border-2 border-dashed border-l-0 border-y-0 border-r-gray-100 left-[19px] absolute) "
            data-cy="debug-historical-runs"
          >
            <li
              v-for="sha of Object.keys(groupByCommit)"
              :key="sha"
              :data-cy="`commit-${sha}`"
            >
              <div class="flex my-10px mx-16px items-center">
                <DebugCommitIcon class="flex-shrink-0" />
                <LightText class="flex-shrink-0 ml-12px truncate">
                  {{ sha.slice(0, 7) }}
                </LightText>
                <Dot />
                <span
                  class="font-medium text-sm text-gray-800 truncate"
                  :title="groupByCommit[sha].message!"
                >
                  {{ groupByCommit[sha].message }}
                </span>
                <span
                  v-if="sha === currentCommitInfo?.sha"
                  data-cy="tag-checked-out"
                  class="border rounded font-medium border-gray-100 border-1 flex-shrink-0
              h-16px ml-8px px-4px text-12px text-purple-400 leading-16px
              align-middle inline-flex items-center"
                >
                  Checked out
                </span>
              </div>

              <ul v-if="groupByCommit[sha].runs">
                <DebugRunNavigationRow
                  v-for="run of groupByCommit[sha].runs"
                  :key="run?.runNumber!"
                  :run-number="run?.runNumber!"
                  :is-current-run="isCurrentRun(run!)"
                  :gql="run!"
                  @change-run="changeRun(run!)"
                />
              </ul>
            </li>
          </ul>
        </div>
        <div
          v-if="runs.length === 100"
          class="border-t border-indigo-100"
        >
          <DebugRunNavigationLimitMessage :cloud-project-url="cloudProjectUrl" />
        </div>
      </div>
    </TransitionQuickFadeVue>
  </div>
</template>

<script lang="ts" setup>
import { gql, useMutation } from '@urql/vue'
import DebugRunNavigationRow from './DebugRunNavigationRow.vue'
import Button from '@packages/frontend-shared/src/components/Button.vue'
import { compact, groupBy } from 'lodash'
import { computed, FunctionalComponent, h } from 'vue'
import { DebugRunNavigationFragment, DebugRunNavigationRunInfoFragment, DebugRunNavigation_MoveToRunDocument } from '../generated/graphql'
import DebugResults from './DebugResults.vue'
import DebugRunNumber from './DebugRunNumber.vue'
import DebugCommitIcon from './DebugCommitIcon.vue'
import DebugRunNavigationLimitMessage from './DebugRunNavigationLimitMessage.vue'
import { IconChevronRightSmall } from '@cypress-design/vue-icon'
import { useDebugRunSummary } from './useDebugRunSummary'
import { useI18n } from '@cy/i18n'
import { useToggle } from '@vueuse/core'
import TransitionQuickFadeVue from '@cy/components/transitions/TransitionQuickFade.vue'

const { t } = useI18n()

gql`
fragment DebugRunNavigationRunInfo on CloudRun {
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
fragment DebugRunNavigation on CloudProject {
  id
  cloudProjectUrl
  allRuns: runsByCommitShas(commitShas: $commitShas) {
    id
    ...DebugRunNavigationRunInfo
  }
}
`

gql`
mutation DebugRunNavigation_moveToRun($runNumber: Int!) {
  moveToRelevantRun(runNumber: $runNumber)
}
`

const props = defineProps<{
  runs: NonNullable<DebugRunNavigationFragment['allRuns']>
  currentRunNumber: number
  cloudProjectUrl?: string
  currentCommitInfo?: { sha: string, message: string } | null
}>()

const Dot: FunctionalComponent = () => {
  return h('span', { class: 'px-8px text-gray-300' }, '•')
}

const LightText: FunctionalComponent = (_props, { slots }) => {
  return h('span', { class: 'text-sm text-gray-700' }, slots?.default?.())
}

const moveToNewRun = useMutation(DebugRunNavigation_MoveToRunDocument)

const [showRuns, toggleRuns] = useToggle(false)

const latest = computed(() => props.runs[0])

useDebugRunSummary(latest)

const current = computed(() => {
  return props.runs?.find((run) => run?.runNumber === props.currentRunNumber)
})

const latestIsCurrentlySelected = computed(() => {
  return latest.value?.runNumber === current.value?.runNumber
})

const groupByCommit = computed(() => {
  const grouped = groupBy(compact(props.runs), (run) => {
    return run?.commitInfo?.sha
  })

  const mapped = {}

  const hasRunsForCurrentCommit = props.currentCommitInfo?.sha && Object.keys(grouped).includes(props.currentCommitInfo.sha)

  if (!hasRunsForCurrentCommit && props.currentCommitInfo) {
    mapped[props.currentCommitInfo.sha] = props.currentCommitInfo
  }

  const result = Object.keys(grouped).reduce<Record<string, {sha: string, message: string | undefined | null, runs: typeof props.runs}>>((acc, curr) => {
    acc[curr] = {
      sha: curr,
      message: grouped[curr][0].commitInfo?.summary,
      runs: grouped[curr],
    }

    return acc
  }, mapped)

  return result
})

const shouldShow = computed(() => {
  return props.runs.length > 1
})

const hideToggle = computed(() => {
  return !latestIsCurrentlySelected.value && props.runs.length === 2
})

function changeRun (run: DebugRunNavigationRunInfoFragment) {
  if (!run.runNumber || !run.commitInfo?.sha) {
    return
  }

  moveToNewRun.executeMutation({ runNumber: run.runNumber })
}

function isCurrentRun (run: DebugRunNavigationRunInfoFragment) {
  return run.runNumber === current.value?.runNumber
}

function specsCompleted (run: DebugRunNavigationRunInfoFragment) {
  if (run.status === 'RUNNING') {
    return t('debugPage.specCounts.whenRunning', { n: run.totalInstanceCount || 0, completed: run.completedInstanceCount || 0, total: run.totalInstanceCount || 0 })
  }

  return t('debugPage.specCounts.whenCompleted', { n: run.totalInstanceCount || 0 })
}
</script>
