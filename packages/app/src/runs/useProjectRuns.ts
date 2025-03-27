import { gql, useMutation, useQuery } from '@urql/vue'
import { Ref, computed, onMounted, onUnmounted } from 'vue'
import { RunsDocument, RunsContainer_FetchNewerRunsDocument, RunCardFragment } from '../generated/graphql'
import type { RunsComposable } from './RunsComposable'

gql`
query Runs {
  ...RunsContainer
}`

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
        cloudProjectUrl
        runs(first: 10) {
          ...RunsContainer_RunsConnection
        }
      }
    }
  }
}`

gql`
mutation RunsContainer_FetchNewerRuns(
  $cloudProjectNodeId: ID!, 
  $beforeCursor: String, 
  $hasBeforeCursor: Boolean!,
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
  }
}
`

export const useProjectRuns = (online: Ref<boolean>): RunsComposable => {
  const query = useQuery({ query: RunsDocument, requestPolicy: 'network-only' })

  const currentProject = computed(() => query.data.value?.currentProject)
  const runs = computed(() => query.data.value?.currentProject?.cloudProject?.__typename === 'CloudProject' ? query.data.value?.currentProject?.cloudProject?.runs?.nodes as RunCardFragment[] : [])

  const variables = computed(() => {
    if (currentProject.value?.cloudProject?.__typename === 'CloudProject') {
      return {
        cloudProjectNodeId: currentProject.value?.cloudProject.id,
        beforeCursor: currentProject.value?.cloudProject.runs?.pageInfo.startCursor,
        hasBeforeCursor: Boolean(currentProject.value?.cloudProject.runs?.pageInfo.startCursor),
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
      if (variables.value && online.value) {
        // tslint:disable:no-floating-promises
        refetcher.executeMutation(variables.value)
        .then(() => {
          startPolling()
        })
      } else {
        startPolling()
      }
    }, POLL_FOR_LATEST)
  }

  onMounted(async () => {
    // Always fetch when the component mounts, and we're not already fetching
    if (online.value && !refetcher.fetching) {
      await refetcher.executeMutation(variables.value)
    }

    startPolling()
  })

  onUnmounted(() => {
    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = null
  })

  function reExecuteRunsQuery () {
    query.executeQuery()
  }

  return {
    runs,
    reExecuteRunsQuery,
    query,
  }
}
