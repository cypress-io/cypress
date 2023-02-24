<template>
  <div class="h-full">
    <TransitionQuickFade mode="out-in">
      <NoInternetConnection v-if="!online">
        {{ t('launchpadErrors.noInternet.connectProject') }}
      </NoInternetConnection>
      <DebugLoading v-else-if="!loginConnectStore.hasInitiallyLoaded || loginConnectStore.project.isProjectConnected && isLoading" />
      <DebugError
        v-else-if="showError"
      />
      <DebugNotLoggedIn
        v-else-if="!loginConnectStore.user.isLoggedIn"
        data-cy="debug-empty"
      />
      <DebugNoProject
        v-else-if="!loginConnectStore.project.isProjectConnected"
        data-cy="debug-empty"
      />
      <DebugNoRuns
        v-else-if="!run"
        data-cy="debug-empty"
      />
      <div
        v-else-if="run?.status"
        class="flex flex-col h-full p-1.5rem gap-24px"
      >
        <DebugNewRelevantRunBar
          v-if="newerRelevantRun"
          :gql="newerRelevantRun"
        />
        <DebugPageHeader
          :gql="run"
          :commits-ahead="props.commitsAhead"
        />
        <DebugTestingProgress v-if="isFirstPendingRun" />

        <DebugPendingRunSplash
          v-if="isFirstPendingRun && (!run.totalFailed || run.totalFailed === 0)"
          class="mt-12"
        />

        <template v-else>
          <DebugPageDetails
            v-if="shouldDisplayDetails(run.status, run.isHidden)"
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
          <DebugSpecLimitBanner
            v-if="run.totalFailed && run.totalFailed > 100"
            :failed-test-count="run.totalFailed"
            :cloud-run-url="run.url"
          />
        </template>
      </div>
    </TransitionQuickFade>
  </div>
</template>

<script setup lang="ts">
import { gql } from '@urql/vue'
import { computed } from 'vue'
import type { CloudRunStatus, DebugSpecsFragment, TestingTypeEnum } from '../generated/graphql'
import { useLoginConnectStore } from '@packages/frontend-shared/src/store/login-connect-store'
import NoInternetConnection from '@packages/frontend-shared/src/components/NoInternetConnection.vue'
import DebugLoading from '../debug/empty/DebugLoading.vue'
import DebugPageHeader from './DebugPageHeader.vue'
import DebugPendingRunSplash from './DebugPendingRunSplash.vue'
import DebugTestingProgress from './DebugTestingProgress.vue'
import DebugSpecList from './DebugSpecList.vue'
import DebugPageDetails from './DebugPageDetails.vue'
import DebugNotLoggedIn from './empty/DebugNotLoggedIn.vue'
import DebugNoProject from './empty/DebugNoProject.vue'
import DebugNoRuns from './empty/DebugNoRuns.vue'
import DebugError from './empty/DebugError.vue'
import DebugSpecLimitBanner from './DebugSpecLimitBanner.vue'
import DebugNewRelevantRunBar from './DebugNewRelevantRunBar.vue'
import { specsList } from './utils/DebugMapping'
import type { CloudRunHidingReason } from './DebugOverLimit.vue'
import TransitionQuickFade from '@cy/components/transitions/TransitionQuickFade.vue'

import dayjs from 'dayjs'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

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
          testsForReview(limit: 100) {
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
  online?: boolean
}>(),
{
  gql: undefined,
  isLoading: false,
  commitsAhead: 0,
  online: true,
})

const loginConnectStore = useLoginConnectStore()

const run = computed(() => {
  return props.gql?.currentProject?.cloudProject?.__typename === 'CloudProject' ? props.gql.currentProject.cloudProject.runByNumber : null
})

const nextRun = computed(() => {
  return props.gql?.currentProject?.cloudProject?.__typename === 'CloudProject' ? props.gql.currentProject.cloudProject.nextRun : null
})

function shouldDisplayDetails (status: CloudRunStatus, isHidden: boolean) {
  return !['RUNNING', 'FAILED'].includes(status) || isHidden
}

function shouldDisplaySpecsList (status: CloudRunStatus) {
  return ['ERRORED', 'CANCELLED', 'TIMEDOUT', 'FAILED', 'RUNNING'].includes(status)
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

const newerRelevantRun = computed(() => nextRun.value)

const isFirstPendingRun = computed(() => run.value && run.value.status === 'RUNNING')

const reasonsRunIsHidden = computed(() => (run.value?.reasonsRunIsHidden || []) as CloudRunHidingReason[])

const runAgeDays = computed(() => run.value?.createdAt && dayjs().diff(dayjs(run.value.createdAt), 'day') || 0)
</script>
