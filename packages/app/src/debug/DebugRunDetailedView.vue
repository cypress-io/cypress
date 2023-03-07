<template>
  <div class="border border-indigo-100 rounded">
    <div class="bg-indigo-50 p-12px flex items-center">
      <button class="flex items-center">
        <IconChevronDownLarge  stroke-color="indigo-400" />
        <span class="text-indigo-500 ml-8px">Switch Runs</span>
      </button>
      <Dot />You are on the most recent run
    </div>

    <ul class="relative">
      <div id="commit-line" class="border-dashed border-l-0 border-y-0 border-2 border-r-gray-100"></div>
      <li v-for="sha of Object.keys(groupByCommit)" class="relative">
        <div class="flex items-center ml-7px py-10px">
          <Icon />
          <span class="ml-16px">
            {{ sha.slice(0, 7) }}
          </span>
           <Dot /> 
           {{  groupByCommit[sha][0]?.commitInfo?.summary }}
        </div>

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
import { groupBy } from 'lodash';
import { watchEffect, computed, FunctionalComponent, h } from 'vue';
import type { DebugRunDetailedViewFragment, DebugRunDetailedRunInfoFragment } from '../generated/graphql'
import { formatDuration, formatCreatedAt } from './utils/formatTime'
import DebugResults from './DebugResults.vue';
import DebugRunNumber from './DebugRunNumber.vue';
import Icon from './Icon.vue'
import { IconChevronDownLarge, IconChevronUpLarge } from '@cypress-design/vue-icon'

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
        id
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

const Dot: FunctionalComponent = () => {
  return h('span', { class: 'px-8px' }, '•')
}

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

<style>
#commit-line {
  height: 100%;
  position: absolute;
  height: 100%;
  top: 0;
  left: 10px;
  width: 5px;
  border-left: 2px dashed gray;
}
</style>