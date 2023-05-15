import { useMutation } from '@urql/vue'
import { Ref, computed, onMounted, onUnmounted } from 'vue'
import { RunsContainerFragment, RunsContainer_FetchNewerRunsDocument } from '../generated/graphql'

export const useProjectRuns = (currentProject: Ref<RunsContainerFragment['currentProject']>, online) => {
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
      if (variables.value && online) {
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
    if (online && !refetcher.fetching) {
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
}
