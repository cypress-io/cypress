import { gql, useMutation, useQuery } from '@urql/vue'
import { Ref, computed, onMounted, onUnmounted } from 'vue'
import { RunsDocument, RunsContainer_FetchNewerRunsDocument } from '../generated/graphql'

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

//TODO
gql`
fragment RunsProject on Query {
  ...RunsErrorRenderer
  currentProject {
    id
    projectId
    ...RunsConnectSuccessAlert
    cloudProject {
      __typename
      ... on CloudProject {
        id
      }
    }
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

export const useProjectRuns = (online: Ref<boolean>) => {
  const query = useQuery({ query: RunsDocument, requestPolicy: 'network-only' })

  const currentProject = computed(() => query.data.value?.currentProject)
  const runs = computed(() => query.data.value?.currentProject?.cloudProject?.__typename === 'CloudProject' ? query.data.value?.currentProject?.cloudProject?.runs?.nodes : undefined)

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
      if (variables.value && online.value) {
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
    if (online.value && !refetcher.fetching) {
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

  function reExecuteRunsQuery () {
    query.executeQuery()
  }

  return {
    currentProject,
    runs,
    reExecuteRunsQuery,
    query, //TODO remove
  }
}
