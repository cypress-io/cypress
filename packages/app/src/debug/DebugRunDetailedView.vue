<template>
  <div>
    <ul>
      <li v-for="sha of Object.keys(groupByCommit)">
        <span>{{ sha.slice(0, 7) }} • {{  groupByCommit[sha][0]?.commitInfo?.summary }}</span>
        <ul>
          <li v-for="run of groupByCommit[sha]" class="flex ml-24px">
            <div v-if="run">
              <DebugRunNumber
                v-if="(run.runNumber && run.status)"
                :status="run.status"
                :value="run.runNumber"
              />
              <DebugResults :gql="run" />
              <span>{{ specsCompleted(run) }}</span>
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
  id
  status
  specs {
    id
    path
    status
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
    const running = run.specs.reduce<number>((acc, curr) => curr.status === 'RUNNING' ? acc + 1 : acc, 0)
    return `${running} of ${run.specs.length} specs completed`
  }

  return `${run.specs.length} specs`
}

watchEffect(() => {
  console.log(groupByCommit.value)
})
</script>