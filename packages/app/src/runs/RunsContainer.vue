<template>
  <div class="h-full ">
    <NoInternetConnection v-if="!online">
      {{ t('launchpadErrors.noInternet.connectProject') }}
    </NoInternetConnection>
    <RunsConnectSuccessAlert
      v-if="currentProject && showConnectSuccessAlert"
      :gql="currentProject"
      :class="{ 'absolute left-[24px] right-[24px] top-[24px]': currentProject?.cloudProject?.__typename === 'CloudProject' && !runs?.length }"
    />

    <RunsConnect
      v-if="!userProjectStatusStore.user.isLoggedIn || !currentProject?.projectId"
      :campaign="!userProjectStatusStore.user.isLoggedIn ? RUNS_PROMO_CAMPAIGNS.login : RUNS_PROMO_CAMPAIGNS.connectProject"
    />
    <RunsErrorRenderer
      v-else-if="currentProject?.cloudProject?.__typename !== 'CloudProject' || connectionFailed"
      :gql="props.gql"
      @re-execute-runs-query="emit('reExecuteRunsQuery')"
    />

    <RunsEmpty
      v-else-if="!runs?.length"
    />
    <div
      v-else
      data-cy="runs"
      class="flex flex-col pb-[24px] gap-[16px]"
    >
      <TrackedBanner
        v-if="userProjectStatusStore.cloudStatusMatches('needsRecordedRun') && userProjectStatusStore.project.isUsingGit"
        :title="t('runs.empty.noRunsFoundForBranch')"
        :banner-id="ACI_052023_NO_RUNS_FOUND_FOR_BRANCH"
        dismissible
        status="warning"
        :has-banner-been-shown="false"
        :event-data="undefined"
      >
        <div
          ref="markdownTarget"
          class="warning-markdown"
          v-html="markdown"
        />
      </TrackedBanner>
      <Warning
        v-if="!online"
        :title="t('launchpadErrors.noInternet.header')"
        :message="t('launchpadErrors.noInternet.message')"
        :dismissible="false"
        class="mx-auto mb-[24px]"
      />
      <TrackedBanner
        v-if="!userProjectStatusStore.project.isUsingGit"
        :title="t('runs.empty.gitRepositoryNotDetected')"
        :banner-id="ACI_052023_GIT_NOT_DETECTED"
        :has-banner-been-shown="false"
        status="warning"
        dismissible
        :event-data="undefined"
      >
        {{ t('runs.empty.ensureGitSetupCorrectly') }}
      </TrackedBanner>
      <template
        v-if="isUsingGit"
      >
        <ul
          class="my-[8px] relative before:content-[''] before:absolute before:top-[20px] before:bottom-[10px] before:w-[2px] before:border-2 before:border-dashed before:border-l-0 before:border-y-0 before:border-r-gray-100 before:left-[7px]"
          data-cy="debug-historical-runs"
        >
          <li
            v-for="sha of Object.keys(groupByCommit)"
            :key="sha"
            :data-cy="`commit-${sha}`"
          >
            <div class="flex items-center my-[10px] [&>*:last-child]:mr-[8px]">
              <DebugCommitIcon class="h-[16px] w-[16px] relative" />
              <LightText class="shrink-0 truncate ml-[8px]">
                {{ sha.slice(0, 7) }}
              </LightText>
              <Dot />
              <span
                class="text-sm font-medium text-gray-800 truncate"
                :title="groupByCommit[sha].message!"
              >
                {{ groupByCommit[sha].message }}
              </span>
              <span
                v-if="sha === currentCommitInfo?.sha"
                data-cy="tag-checked-out"
                class="inline-flex items-center shrink-0 font-medium text-purple-400 align-middle border border-gray-100 rounded border-1 h-[16px] ml-[8px] px-[4px] text-[12px] leading-[16px]"
              >
                Checked out
              </span>
            </div>
            <ul
              v-if="groupByCommit[sha].runs"
              class="relative bg-white border border-gray-100 rounded border-1"
            >
              <li
                v-for="run of groupByCommit[sha].runs"
                :key="run.id"
                class="border-gray-100 [&:not(:last-child)]:border-b"
              >
                <RunCard
                  :gql="run"
                  :show-debug="true"
                  :debug-enabled="enableDebugging(run.id)"
                />
              </li>
            </ul>
          </li>
        </ul>
        <Button
          data-cy="open-cloud-latest"
          variant="outline-indigo"
          size="32"
          class="self-start"
          :href="latestRunUrl"
        >
          <IconTechnologyCypress class="h-[16px] w-[16px] mr-[8px]" />
          {{ t('runs.container.viewCloudRuns') }}
        </Button>
      </template>
      <template
        v-else
      >
        <ul
          class="relative bg-white border border-gray-100 rounded border-1"
        >
          <li
            v-for="run of runs"
            :key="run.id"
            class="border-gray-100 [&:not(:last-child)]:border-b"
          >
            <RunCard
              :key="run.id"
              :gql="run"
            />
          </li>
        </ul>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { compact, groupBy } from 'lodash'
import { computed, ref, watch, h, FunctionalComponent } from 'vue'
import { useI18n } from '@cy/i18n'
import NoInternetConnection from '@packages/frontend-shared/src/components/NoInternetConnection.vue'
import RunCard from './RunCard.vue'
import RunsConnect from './RunsConnect.vue'
import RunsConnectSuccessAlert from './RunsConnectSuccessAlert.vue'
import RunsEmpty from './RunsEmpty.vue'
import Warning from '@packages/frontend-shared/src/warning/Warning.vue'
import RunsErrorRenderer from './RunsErrorRenderer.vue'
import DebugCommitIcon from '../debug/DebugCommitIcon.vue'
import Button from '@cypress-design/vue-button'
import { IconTechnologyCypress } from '@cypress-design/vue-icon'
import { useUserProjectStatusStore } from '@packages/frontend-shared/src/store/user-project-status-store'
import { RUNS_PROMO_CAMPAIGNS, RUNS_TAB_MEDIUM } from './utils/constants'
import { getUrlWithParams } from '@packages/frontend-shared/src/utils/getUrlWithParams'
import { getUtmSource } from '@packages/frontend-shared/src/utils/getUtmSource'
import TrackedBanner from '../specs/banners/TrackedBanner.vue'
import { BannerIds } from '@packages/types/src'
import { useMarkdown } from '@packages/frontend-shared/src/composables/useMarkdown'
import type { RunCardFragment, RunsContainerFragment, RunsGitTreeQuery } from '../generated/graphql'

const { t } = useI18n()

const markdownTarget = ref()

const { ACI_052023_GIT_NOT_DETECTED, ACI_052023_NO_RUNS_FOUND_FOR_BRANCH } = BannerIds

const emit = defineEmits<{
  (e: 'reExecuteRunsQuery'): void
}>()

const currentProject = computed(() => props.gql.currentProject)

const props = defineProps<{
  gql: RunsContainerFragment | RunsGitTreeQuery
  runs?: RunCardFragment[]
  online: boolean
  allRunIds?: string[]
  isUsingGit?: boolean
  currentCommitInfo?: { sha: string, message: string } | null
}>()

const Dot: FunctionalComponent = () => {
  return h('span', { class: 'px-[8px] text-gray-300' }, '•')
}

const LightText: FunctionalComponent = (_props, { slots }) => {
  return h('span', { class: 'text-sm text-gray-700' }, slots?.default?.())
}

const showConnectSuccessAlert = ref(false)
const connectionFailed = computed(() => !props.gql.currentProject?.cloudProject && props.online)

const latestRunUrl = computed(() => {
  if (props.gql.currentProject?.cloudProject?.__typename !== 'CloudProject') {
    return '#'
  }

  return getUrlWithParams({
    url: props.gql.currentProject?.cloudProject?.cloudProjectUrl,
    params: {
      utm_source: getUtmSource(),
      utm_medium: RUNS_TAB_MEDIUM,
      utm_campaign: 'View runs in Cypress Cloud',
    },
  })
})

const noRunsForBranchMessage = computed(() => {
  const learnMoreLink = getUrlWithParams({
    url: 'https://on.cypress.io/git-info',
    params: {
      utm_source: getUtmSource(),
      utm_medium: RUNS_TAB_MEDIUM,
      utm_campaign: 'No Runs Found',
    },
  })

  const message = t('runs.empty.noRunsForBranchMessage')
  const link = `[${t('links.learnMoreButton')}](${learnMoreLink})`

  return `${message} ${link}`
})

const { markdown } = useMarkdown(markdownTarget, noRunsForBranchMessage.value, { classes: { code: ['bg-warning-200'] } })

const userProjectStatusStore = useUserProjectStatusStore()

const enableDebugging = (runId: string) => {
  const allRunIds = props.allRunIds

  if (!allRunIds) {
    return false
  }

  return allRunIds.some((allRunId) => runId === allRunId)
}

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

watch(() => userProjectStatusStore.project.isProjectConnected, (newVal, oldVal) => {
  if (newVal && oldVal === false) {
    // only show this alert if we have just connected
    showConnectSuccessAlert.value = true
  } else {
    // otherwise, set to false, eg if we just connected,
    // and then manually reverted the config changes
    // or edited the project ID
    showConnectSuccessAlert.value = false
  }
})

</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity .3s
}

.fade-enter-from, .fade-leave-to {
  opacity: 0
}
</style>
