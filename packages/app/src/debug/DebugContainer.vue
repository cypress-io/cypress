<template>
  <div class="h-full">
    <TransitionQuickFade mode="out-in">
      <NoInternetConnection v-if="!online">
        {{ t('launchpadErrors.noInternet.connectProject') }}
      </NoInternetConnection>
      <DebugLoading v-else-if="!userProjectStatusStore.hasInitiallyLoaded || userProjectStatusStore.project.isProjectConnected && isLoading" />

      <DebugNotLoggedIn
        v-else-if="!userProjectStatusStore.user.isLoggedIn"
        data-cy="debug-empty"
      />
      <DebugNoProject
        v-else-if="!userProjectStatusStore.project.isProjectConnected"
        data-cy="debug-empty"
      />
      <DebugError
        v-else-if="!userProjectStatusStore.project.isUsingGit"
      />
      <DebugBranchError
        v-else-if="cloudStatusMatches('needsRecordedRun')"
      />
      <DebugNoRuns
        v-else-if="!run"
        data-cy="debug-empty"
      />
      <div
        v-else-if="run?.status"
        class="flex flex-col p-[1.5rem] gap-[24px]"
        :class="{'h-full': shouldBeFullHeight}"
      >
        <DebugRunNavigation
          v-if="allRuns && run.runNumber"
          class="shrink-0"
          :runs="allRuns"
          :current-run-number="run.runNumber"
          :current-commit-info="currentCommitInfo"
          :cloud-project-url="cloudProject?.cloudProjectUrl"
        />

        <DebugPageHeader
          :gql="run"
          :commits-ahead="props.commitsAhead"
        />
        <TransitionQuickFade>
          <DebugTestingProgress
            v-if="isRunning && run.id"
            :run-id="run.id"
            class="shrink-0"
          />
        </TransitionQuickFade>

        <DebugPendingRunSplash
          v-if="shouldShowPendingRunSplash"
          class="grow"
          :is-completion-scheduled="isScheduledToComplete"
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
import { useUserProjectStatusStore } from '@packages/frontend-shared/src/store/user-project-status-store'
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
import DebugBranchError from './empty/DebugBranchError.vue'
import DebugSpecLimitBanner from './DebugSpecLimitBanner.vue'
import DebugRunNavigation from './DebugRunNavigation.vue'
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
fragment RunDetail on CloudRun {
  ...DebugPageHeader
  cancelledBy {
    id
    fullName
    email
  }
  cancelledAt
  scheduledToCompleteAt
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
          id
          ...RunDetail
        } 
        ...DebugRunNavigation
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
  isLoading?: boolean
  commitsAhead?: number
  online?: boolean
  currentCommitInfo?: InstanceType<typeof DebugRunNavigation>['$props']['currentCommitInfo'] | null
}>(),
{
  gql: undefined,
  isLoading: false,
  commitsAhead: 0,
  online: true,
  currentCommitInfo: undefined,
})

const userProjectStatusStore = useUserProjectStatusStore()

const { cloudStatusMatches } = userProjectStatusStore

const cloudProject = computed(() => {
  return props.gql?.currentProject?.cloudProject?.__typename === 'CloudProject'
    ? props.gql.currentProject.cloudProject
    : null
})

const allRuns = computed(() => {
  return cloudProject.value?.allRuns
})

const run = computed(() => {
  return cloudProject.value?.runByNumber
})

function shouldDisplayDetails (status: CloudRunStatus, isHidden: boolean) {
  return !['RUNNING', 'FAILED'].includes(status) || isHidden
}

function shouldDisplaySpecsList (status: CloudRunStatus) {
  return ['ERRORED', 'CANCELLED', 'TIMEDOUT', 'FAILED', 'RUNNING'].includes(status)
}

const shouldShowPendingRunSplash = computed(() => {
  return isRunning.value && !run.value?.totalFailed
})

const shouldBeFullHeight = computed(() => {
  const willShowCenteredContentInRun = !!run.value && !!run.value.status && (['PASSED', 'OVERLIMIT'].includes(run.value.status) || run.value.isHidden)

  return shouldShowPendingRunSplash.value || willShowCenteredContentInRun
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

const isRunning = computed(() => !!run.value && run.value.status === 'RUNNING')

const isScheduledToComplete = computed(() => !!run.value?.scheduledToCompleteAt)

const reasonsRunIsHidden = computed(() => (run.value?.reasonsRunIsHidden || []) as CloudRunHidingReason[])

const runAgeDays = computed(() => run.value?.createdAt && dayjs().diff(dayjs(run.value.createdAt), 'day') || 0)
</script>
