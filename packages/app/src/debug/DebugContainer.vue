<template>
  <div class="h-full">
    <DebugLoading v-if="isLoading" />
    <DebugError
      v-else-if="showError"
    />
    <div
      v-else-if="loginConnectStore.user.isLoggedIn && loginConnectStore.project.isProjectConnected && run?.status"
      class="flex flex-col h-full"
    >
      <DebugPageHeader
        :gql="run"
        :commits-ahead="props.commitsAhead"
      />
      <DebugNewRelevantRunBar
        v-if="newerRelevantRun"
        :gql="newerRelevantRun"
      />

      <DebugPendingRunSplash
        v-if="isFirstPendingRun"
        class="mt-12"
        :spec-statuses="specStatuses"
      />
      <template v-else>
        <DebugPageDetails
          v-if="shouldDisplayDetails(run.status)"
          :status="run.status"
          :specs="run.specs"
          :cancellation="{ cancelledAt: run.cancelledAt, cancelledBy: run.cancelledBy }"
          :is-hidden="run.isHidden"
          :reasons-run-is-hidden="reasonsRunIsHidden"
          :over-limit-action-type="run.overLimitActionType"
          :over-limit-action-url="run.overLimitActionUrl"
          :ci="run.ci"
          :errors="run.errors"
          :run-age-days="runAgeDays"
        />
        <DebugSpecList
          v-if="run.totalFailed && shouldDisplaySpecsList(run.status)"
          :specs="debugSpecsArray"
        />
      </template>
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
import type { CloudRunStatus, DebugSpecsFragment, TestingTypeEnum } from '../generated/graphql'
import { useLoginConnectStore } from '@packages/frontend-shared/src/store/login-connect-store'
import DebugLoading from '../debug/empty/DebugLoading.vue'
import DebugPageHeader from './DebugPageHeader.vue'
import DebugPendingRunSplash from './DebugPendingRunSplash.vue'
import DebugSpecList from './DebugSpecList.vue'
import DebugPageDetails from './DebugPageDetails.vue'
import DebugNotLoggedIn from './empty/DebugNotLoggedIn.vue'
import DebugNoProject from './empty/DebugNoProject.vue'
import DebugNoRuns from './empty/DebugNoRuns.vue'
import DebugError from './empty/DebugError.vue'
import DebugNewRelevantRunBar from './DebugNewRelevantRunBar.vue'
import { specsList } from './utils/DebugMapping'
import type { CloudRunHidingReason } from './DebugOverLimit.vue'
import dayjs from 'dayjs'

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
        runByNumber(runNumber: $runNumber) {
          ...DebugPageHeader
          cancelledBy {
            id
            fullName
            email
          }
          cancelledAt
          id
          runNumber
          errors
          status
          overLimitActionType
          overLimitActionUrl
          isHidden
          reasonsRunIsHidden {
            __typename
            ... on DataRetentionLimitExceeded {
              dataRetentionDays
            }
            ... on UsageLimitExceeded {
              monthlyTests
            }
          }
          totalTests
          ci {
            id
            ...DebugPageDetails_cloudCiBuildInfo
          }
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
          createdAt
        }
        nextRun: runByNumber(runNumber: $nextRunNumber) @include(if: $hasNextRun) {
          id
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

const props = withDefaults(defineProps<{
  gql?: DebugSpecsFragment
  // This prop is just to stub the error state for now
  showError?: boolean
  isLoading?: boolean
  commitsAhead?: number
}>(),
{
  gql: undefined,
  isLoading: false,
  commitsAhead: 0,
})

const loginConnectStore = useLoginConnectStore()

const run = computed(() => {
  return props.gql?.currentProject?.cloudProject?.__typename === 'CloudProject' ? props.gql.currentProject.cloudProject.runByNumber : null
})

const nextRun = computed(() => {
  return props.gql?.currentProject?.cloudProject?.__typename === 'CloudProject' ? props.gql.currentProject.cloudProject.nextRun : null
})

function shouldDisplayDetails (status: CloudRunStatus) {
  return !['RUNNING', 'FAILED'].includes(status)
}

function shouldDisplaySpecsList (status: CloudRunStatus) {
  return ['ERRORED', 'CANCELLED', 'TIMEDOUT', 'FAILED'].includes(status)
}

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

const specStatuses = computed(() => run.value?.specs.map((spec) => spec.status || 'UNCLAIMED') || [])

const newerRelevantRun = computed(() => nextRun.value)

const isFirstPendingRun = computed(() => run.value && run.value.runNumber === 1 && run.value.status === 'RUNNING')

const reasonsRunIsHidden = computed(() => (run.value?.reasonsRunIsHidden || []) as CloudRunHidingReason[])

const runAgeDays = computed(() => run.value?.createdAt && dayjs().diff(dayjs(run.value.createdAt), 'day') || 0)
</script>
