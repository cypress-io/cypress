<template>
  <div>
    <ul>
      <li v-for="sha of Object.keys(groupByCommit)">
        <span>{{ sha.slice(0, 7) }} • {{  groupByCommit[sha][0]?.commitInfo?.summary }}</span>
        <ul>
          <li 
            v-for="run of groupByCommit[sha]" 
            class="flex ml-24px p-10px"
            :class="{ 'bg-indigo-50': run?.runNumber === cloudProject?.current?.runNumber }"
          >
            <div v-if="run" class="flex justify-between w-full">
              <div class="flex">
                <DebugRunNumber
                  v-if="(run.runNumber && run.status)"
                  :status="run.status"
                  :value="run.runNumber"
                  class="mr-8px"
                />
                <DebugResults :gql="run" />
                <span><span class="px-4px">•</span> {{ specsCompleted(run) }}</span>
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
import { groupBy } from 'lodash';
import { watchEffect, computed } from 'vue';
import type { DebugRunDetailedViewFragment, DebugRunDetailedRunInfoFragment } from '../generated/graphql'
import { formatDuration, formatCreatedAt } from './utils/formatTime'
import DebugResults from './DebugResults.vue';
import DebugRunNumber from './DebugRunNumber.vue';

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

fragment DebugRunDetailedView on Query {
  currentProject {
    id
    projectId
    cloudProject {
      __typename
      ... on CloudProject {
        all: runsByCommitShas(commitShas: ["fea0b14c3902050ee7962a60e01b0d53d336d589", "f5a499232263f6e6a6aac77ce05ea09cf4b4aad8"]) {
          ...DebugRunDetailedRunInfo
        }
        next: runByNumber(runNumber: 9) {
          ...DebugRunDetailedRunInfo
        }
        current: runByNumber(runNumber: 9) {
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

const cloudProject = computed(() => {
  return props.gql?.currentProject?.cloudProject?.__typename === 'CloudProject' ? props.gql.currentProject.cloudProject : null
})

const groupByCommit = computed(() => {
  return groupBy(cloudProject.value?.all ?? [], el => {
    return el?.commitInfo?.sha
  })
})

function specsCompleted (run: DebugRunDetailedRunInfoFragment) {
  if (run.status === 'RUNNING') {
    return `${run.completedInstanceCount} of ${run.totalInstanceCount} specs completed`
  }

  return `${run.completedInstanceCount} specs`
}

watchEffect(() => {
  console.log(groupByCommit.value)
})
</script>