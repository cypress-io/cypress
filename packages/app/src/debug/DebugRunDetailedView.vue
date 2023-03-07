<template>
  <div class="border border-indigo-100 rounded">
    <div class="bg-indigo-50 p-12px flex items-center">
      <button class="flex items-center">
        <IconChevronDownLarge stroke-color="indigo-400" />
        <span class="text-indigo-500 ml-8px">Switch Runs</span>
      </button>
      <Dot />You are on the most recent run
    </div>

    <ul class="relative">
      <div class="w-5px left-[10px] absolute border-dashed border-l-0 border-y-0 border-2 border-r-gray-100 h-full" />
      <li
        v-for="sha of Object.keys(groupByCommit)"
        :key="sha"
        class="relative"
        :data-cy="`commit-${sha}`"
      >
        <div class="flex items-center ml-7px py-10px">
          <Icon />
          <span class="ml-16px">
            {{ sha.slice(0, 7) }}
          </span>
          <Dot />
          {{ groupByCommit[sha][0]?.commitInfo?.summary }}
        </div>

        <ul>
          <li
            v-for="run of groupByCommit[sha]"
            :key="run?.runNumber!"
            class="flex ml-24px p-10px"
            :class="{ 'bg-indigo-50': run?.runNumber === cloudProject?.current?.runNumber }"
          >
            <div
              v-if="run"
              class="flex justify-between w-full"
            >
              <div class="flex">
                <DebugRunNumber
                  v-if="(run.runNumber && run.status)"
                  :status="run.status"
                  :value="run.runNumber"
                  class="mr-8px"
                />
                <DebugResults :gql="run" />
                <span><Dot />{{ specsCompleted(run) }}</span>
              </div>
              <div>{{ formatDuration(run.totalDuration ?? 0) }} ({{ formatCreatedAt(run.createdAt) }})</div>
            </div>
          </li>
        </ul>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { gql } from '@urql/vue'
import { groupBy } from 'lodash'
import { computed, FunctionalComponent, h } from 'vue'
import type { DebugRunDetailedViewFragment, DebugRunDetailedRunInfoFragment } from '../generated/graphql'
import { formatDuration, formatCreatedAt } from './utils/formatTime'
import DebugResults from './DebugResults.vue'
import DebugRunNumber from './DebugRunNumber.vue'
import Icon from './Icon.vue'
import { IconChevronDownLarge } from '@cypress-design/vue-icon'

gql`
fragment DebugRunDetailedRunInfo on CloudRun {
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

// all: runsByCommitShas(commitShas: ["fea0b14c3902050ee7962a60e01b0d53d336d589", "f5a499232263f6e6a6aac77ce05ea09cf4b4aad8"]) {
gql`
fragment DebugRunDetailedView on Query {
  currentProject {
    id
    projectId
    cloudProject {
      __typename
      ... on CloudProject {
        id
        all: runsByCommitShas(commitShas: $commitShas) {
          id
          ...DebugRunDetailedRunInfo
        }
        next: runByNumber(runNumber: $nextRunNumber) @include(if: $hasNextRun) {
          id
          ...DebugRunDetailedRunInfo
        }
        current: runByNumber(runNumber: $runNumber) {
          id
          ...DebugRunDetailedRunInfo
        }
      }
    }
  }
}
`

const props = defineProps<{
  gql: DebugRunDetailedViewFragment
}>()

const Dot: FunctionalComponent = () => {
  return h('span', { class: 'px-8px' }, '•')
}

const cloudProject = computed(() => {
  return props.gql?.currentProject?.cloudProject?.__typename === 'CloudProject' ? props.gql.currentProject.cloudProject : null
})

const groupByCommit = computed(() => {
  if (cloudProject.value?.next?.status !== 'RUNNING') {
    const sha = cloudProject.value?.next?.commitInfo?.sha!

    return {
      [sha]: cloudProject.value?.all?.filter((x) => x?.commitInfo?.sha! === sha) ?? [],
    }
  }

  return groupBy(cloudProject.value?.all ?? [], (el) => {
    return el?.commitInfo?.sha
  })
})

function specsCompleted (run: DebugRunDetailedRunInfoFragment) {
  if (run.status === 'RUNNING') {
    return `${run.completedInstanceCount} of ${run.totalInstanceCount} specs completed`
  }

  return `${run.completedInstanceCount} specs`
}
</script>
