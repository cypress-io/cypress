<template>
  <div>
    <DebugError
      v-if="showError"
    />
    <div
      v-else-if="loginConnectStore.user.isLoggedIn && loginConnectStore.project.isProjectConnected && run"
    >
      <DebugPageHeader
        :gql="run"
        :commits-ahead="0"
      />
      <DebugNewRelevantRunBar
        v-if="newerRelevantRun"
        :gql="newerRelevantRun"
      />

      <DebugPendingRunSplash
        v-if="isFirstPendingRun"
        :total-skipped="run.totalSkipped || 0"
        :total-failed="run.totalFailed || 0"
        :total-passed="run.totalPassed || 0"
        :total-tests="run.totalTests || 0"
      />
      <DebugSpecList
        v-else
        :specs="debugSpecsArray"
      />
    </div>
    <div
      v-else
      data-cy="debug-empty"
    >
      <DebugNotLoggedIn v-if="!loginConnectStore.user.isLoggedIn" />
      <DebugNoProject v-else-if="!loginConnectStore.project.isProjectConnected" />
      <DebugNoRuns v-else-if="!run" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { gql } from '@urql/vue'
import { computed } from '@vue/reactivity'
import type { DebugSpecsFragment, TestingTypeEnum } from '../generated/graphql'
import { useLoginConnectStore } from '@packages/frontend-shared/src/store/login-connect-store'
import DebugPageHeader from './DebugPageHeader.vue'
import DebugPendingRunSplash from './DebugPendingRunSplash.vue'
import DebugSpecList from './DebugSpecList.vue'
import DebugNotLoggedIn from './empty/DebugNotLoggedIn.vue'
import DebugNoProject from './empty/DebugNoProject.vue'
import DebugNoRuns from './empty/DebugNoRuns.vue'
import DebugError from './empty/DebugError.vue'
import DebugNewRelevantRunBar from './DebugNewRelevantRunBar.vue'
import { specsList } from './utils/DebugMapping'

gql`
fragment DebugLocalSpecs on Spec {
  id
  absolute
  relative
}
`

gql`
fragment DebugSpecs on Query {
  currentProject {
    id
    cloudProject {
      __typename
      ... on CloudProject {
        id
        runByNumber(runNumber: 11) {
          ...DebugPageHeader
          id
          runNumber
          status
          overLimitActionType
          overLimitActionUrl
          testsForReview {
            id
            ...DebugSpecListTests
          }
          specs {
            id
            ...DebugSpecListSpec
          }
          groups {
            id,
            ...DebugSpecListGroups
          }
          ...DebugPendingRunSplash
          ...DebugNewRelevantRunBar
        }
      }
    }
    specs {
      id
      ...DebugLocalSpecs
    }
    currentTestingType
  }
}
`

const props = defineProps<{
  gql?: DebugSpecsFragment
  // This prop is just to stub the error state for now
  showError?: boolean
}>()

const loginConnectStore = useLoginConnectStore()

const run = computed(() => {
  return props.gql?.currentProject?.cloudProject?.__typename === 'CloudProject' ? props.gql.currentProject.cloudProject.runByNumber : null
})

const debugSpecsArray = computed(() => {
  if (run.value && props.gql?.currentProject) {
    const specs = run.value.specs || []
    const tests = run.value.testsForReview || []
    const groups = run.value.groups || []
    // Will be defined so ignore the possibility of null for testingType
    const currentTestingType = props.gql.currentProject.currentTestingType as TestingTypeEnum
    const localSpecs = props.gql.currentProject.specs

    return specsList({
      specs,
      tests,
      groups,
      localSpecs,
      currentTestingType,
    })
  }

  return []
})

// TODO Re-map to relevant run data point (stubbed with current run)
const newerRelevantRun = computed(() => run.value)

// TODO Validate logic for determining whether this is the "first" run - use runNumber, or some other flag?
const isFirstPendingRun = computed(() => run.value && run.value.runNumber === 1 && run.value.status === 'RUNNING')
</script>
