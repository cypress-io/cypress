<template>
  <div class="h-full">
    <NoInternetConnection v-if="!online">
      Please check your internet connection to resolve this issue. When your internet connection is fixed, we will automatically attempt to fetch your latest runs for this project.
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
        title="No runs found for your branch"
        :banner-id="ACI_052023_NO_RUNS_FOUND_FOR_BRANCH"
        dismissible
        status="warning"
        :has-banner-been-shown="false"
        :event-data="undefined"
      >
        <!-- eslint-disable vue/no-v-html -- markdown rendered by useMarkdown from the no-runs message -->
        <div
          ref="markdownTarget"
          class="warning-markdown"
          v-html="markdown"
        />
        <!-- eslint-enable vue/no-v-html -->
      </TrackedBanner>
      <Warning
        v-if="!online"
        title="You have no internet connection"
        message="Check your internet connection to pull the latest data from Cypress Cloud."
        :dismissible="false"
        class="mx-auto mb-[24px]"
      />
      <TrackedBanner
        v-if="!userProjectStatusStore.project.isUsingGit"
        title="Git repository not detected"
        :banner-id="ACI_052023_GIT_NOT_DETECTED"
        :has-banner-been-shown="false"
        status="warning"
        dismissible
        :event-data="undefined"
      >
        Cypress uses Git to associate runs with your local state. As a fallback, all runs for your project are shown. Please ensure that version control is set up correctly.
      </TrackedBanner>
      <RunsLayout
        :runs="runs"
        :all-run-ids="allRunIds"
        :is-using-git="userProjectStatusStore.project.isUsingGit"
        :latest-run-url="latestRunUrl"
        :current-commit-info="props.currentCommitInfo"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import NoInternetConnection from '@packages/frontend-shared/src/components/NoInternetConnection.vue'
import RunsConnect from './RunsConnect.vue'
import RunsConnectSuccessAlert from './RunsConnectSuccessAlert.vue'
import RunsEmpty from './RunsEmpty.vue'
import RunsLayout from './RunsLayout.vue'
import Warning from '@packages/frontend-shared/src/warning/Warning.vue'
import RunsErrorRenderer from './RunsErrorRenderer.vue'
import { useUserProjectStatusStore } from '@packages/frontend-shared/src/store/user-project-status-store'
import { RUNS_PROMO_CAMPAIGNS, RUNS_TAB_MEDIUM } from './utils/constants'
import { getUrlWithParams } from '@packages/frontend-shared/src/utils/getUrlWithParams'
import { getUtmSource } from '@packages/frontend-shared/src/utils/getUtmSource'
import TrackedBanner from '../specs/banners/TrackedBanner.vue'
import { BannerIds } from '@packages/types/src'
import { useMarkdown } from '@packages/frontend-shared/src/composables/useMarkdown'
import type { RunCardFragment, RunsContainerFragment, RunsGitTreeQuery } from '../generated/graphql'

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
  currentCommitInfo?: { sha: string, message: string } | null
}>()

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

  const message = 'Cypress uses Git to show runs for your branch. As a fallback, all runs for your project are shown. Ensure that version control is properly configured and that you are sending Git information to Cypress Cloud.'
  const link = `[Learn more](${learnMoreLink})`

  return `${message} ${link}`
})

const { markdown } = useMarkdown(markdownTarget, noRunsForBranchMessage.value, { classes: { code: ['bg-warning-200'] } })

const userProjectStatusStore = useUserProjectStatusStore()

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
