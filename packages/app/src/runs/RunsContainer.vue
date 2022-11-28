<template>
  <div class="h-full">
    <NoInternetConnection v-if="!online">
      {{ t('launchpadErrors.noInternet.connectProject') }}
    </NoInternetConnection>
    <RunsConnectSuccessAlert
      v-if="currentProject && showConnectSuccessAlert"
      :gql="currentProject"
      :class="{ 'absolute left-24px right-24px top-24px': currentProject?.cloudProject?.__typename === 'CloudProject' && !currentProject.cloudProject.runs?.nodes.length }"
    />
    <RunsConnect
      v-if="!currentProject?.projectId || !cloudViewer?.id"
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
      class="flex flex-col pb-24px gap-16px"
    >
      <Warning
        v-if="!online"
        :title="t('launchpadErrors.noInternet.header')"
        :message="t('launchpadErrors.noInternet.message')"
        :dismissible="false"
        class="mx-auto mb-24px"
      />
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
import { useLoginConnectStore } from '@packages/frontend-shared/src/store/login-connect-store'

const { t } = useI18n()

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

const loginConnectStore = useLoginConnectStore()

watch(() => loginConnectStore.project.isProjectConnected, (newVal, oldVal) => {
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
