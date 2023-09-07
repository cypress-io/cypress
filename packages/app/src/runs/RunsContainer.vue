<template>
  <div class="h-full">
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
import { useI18n } from '@cy/i18n'
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

  const message = t('runs.empty.noRunsForBranchMessage')
  const link = `[${t('links.learnMoreButton')}](${learnMoreLink})`

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
