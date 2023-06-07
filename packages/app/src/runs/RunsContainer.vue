<template>
  <div class="h-full ">
    <NoInternetConnection v-if="!online">
      {{ t('launchpadErrors.noInternet.connectProject') }}
    </NoInternetConnection>
    <RunsConnectSuccessAlert
      v-if="currentProject && showConnectSuccessAlert"
      :gql="currentProject"
      :class="{ 'absolute left-[24px] right-[24px] top-[24px]': currentProject?.cloudProject?.__typename === 'CloudProject' && !currentProject.cloudProject.runs?.nodes.length }"
    />

    <RunsConnect
      v-if="!currentProject?.projectId || !cloudViewer?.id"
      :campaign="!cloudViewer?.id ? RUNS_PROMO_CAMPAIGNS.login : RUNS_PROMO_CAMPAIGNS.connectProject"
    />
    <RunsErrorRenderer
      v-else-if="currentProject?.cloudProject?.__typename !== 'CloudProject' || connectionFailed"
      :gql="props.gql"
      @re-execute-runs-query="emit('reExecuteRunsQuery')"
    />

    <RunsEmpty
      v-else-if="!currentProject?.cloudProject?.runs?.nodes.length"
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
      <RunCard
        v-for="run of currentProject?.cloudProject?.runs?.nodes"
        :key="run.id"
        :gql="run"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { gql, useMutation } from '@urql/vue'
import { useI18n } from '@cy/i18n'
import NoInternetConnection from '@packages/frontend-shared/src/components/NoInternetConnection.vue'
import RunCard from './RunCard.vue'
import RunsConnect from './RunsConnect.vue'
import RunsConnectSuccessAlert from './RunsConnectSuccessAlert.vue'
import RunsEmpty from './RunsEmpty.vue'
import { RunsContainerFragment, RunsContainer_FetchNewerRunsDocument } from '../generated/graphql'
import Warning from '@packages/frontend-shared/src/warning/Warning.vue'
import RunsErrorRenderer from './RunsErrorRenderer.vue'
import { useUserProjectStatusStore } from '@packages/frontend-shared/src/store/user-project-status-store'
import { RUNS_PROMO_CAMPAIGNS, RUNS_TAB_MEDIUM } from './utils/constants'
import { getUrlWithParams } from '@packages/frontend-shared/src/utils/getUrlWithParams'
import { getUtmSource } from '@packages/frontend-shared/src/utils/getUtmSource'
import TrackedBanner from '../specs/banners/TrackedBanner.vue'
import { BannerIds } from '@packages/types/src'
import { useMarkdown } from '@packages/frontend-shared/src/composables/useMarkdown'

const { t } = useI18n()

const markdownTarget = ref()

const { ACI_052023_GIT_NOT_DETECTED, ACI_052023_NO_RUNS_FOUND_FOR_BRANCH } = BannerIds

const emit = defineEmits<{
  (e: 'reExecuteRunsQuery'): void
}>()

gql`
fragment RunsContainer_RunsConnection on CloudRunConnection {
  nodes {
    id
    ...RunCard
  }
  pageInfo {
    startCursor
  }
}
`

gql`
fragment RunsContainer on Query {
  ...RunsErrorRenderer
  currentProject {
    id
    projectId
    ...RunsConnectSuccessAlert
    cloudProject {
      __typename
      ... on CloudProject {
        id
        runs(first: 10) {
          ...RunsContainer_RunsConnection
        }
      }
    }
  }
  cloudViewer {
    id
  }
}`

gql`
mutation RunsContainer_FetchNewerRuns(
  $cloudProjectNodeId: ID!, 
  $beforeCursor: String, 
  $hasBeforeCursor: Boolean!,
  $refreshPendingRuns: [ID!]!,
  $hasRefreshPendingRuns: Boolean!
) {
  refetchRemote {
    cloudNode(id: $cloudProjectNodeId) {
      id
      __typename
      ... on CloudProject {
        runs(first: 10) @skip(if: $hasBeforeCursor) {
          ...RunsContainer_RunsConnection
        }
        newerRuns: runs(last: 10, before: $beforeCursor) @include(if: $hasBeforeCursor) {
          ...RunsContainer_RunsConnection
        }
      }
    }
    cloudNodesByIds(ids: $refreshPendingRuns) @include(if: $hasRefreshPendingRuns) {
      id
      ... on CloudRun {
        ...RunCard
      }
    }
  }
}
`

const currentProject = computed(() => props.gql.currentProject)
const cloudViewer = computed(() => props.gql.cloudViewer)

const variables = computed(() => {
  if (currentProject.value?.cloudProject?.__typename === 'CloudProject') {
    const toRefresh = currentProject.value?.cloudProject.runs?.nodes?.map((r) => r.status === 'RUNNING' ? r.id : null).filter((f) => f) ?? []

    return {
      cloudProjectNodeId: currentProject.value?.cloudProject.id,
      beforeCursor: currentProject.value?.cloudProject.runs?.pageInfo.startCursor,
      hasBeforeCursor: Boolean(currentProject.value?.cloudProject.runs?.pageInfo.startCursor),
      refreshPendingRuns: toRefresh,
      hasRefreshPendingRuns: toRefresh.length > 0,
    }
  }

  return undefined as any
})

const refetcher = useMutation(RunsContainer_FetchNewerRunsDocument)

// 15 seconds polling
const POLL_FOR_LATEST = 1000 * 15
let timeout: null | number = null

function startPolling () {
  timeout = window.setTimeout(function fetchNewerRuns () {
    if (variables.value && props.online) {
      refetcher.executeMutation(variables.value)
      .then(() => {
        startPolling()
      })
    } else {
      startPolling()
    }
  }, POLL_FOR_LATEST)
}

onMounted(() => {
  // Always fetch when the component mounts, and we're not already fetching
  if (props.online && !refetcher.fetching) {
    refetcher.executeMutation(variables.value)
  }

  startPolling()
})

onUnmounted(() => {
  if (timeout) {
    clearTimeout(timeout)
  }

  timeout = null
})

const props = defineProps<{
  gql: RunsContainerFragment
  online: boolean
}>()

const showConnectSuccessAlert = ref(false)
const connectionFailed = computed(() => !props.gql.currentProject?.cloudProject && props.online)

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
