import { gql, useQuery } from '@urql/vue'
import { Ref, computed } from 'vue'
import { RunsGitTreeDocument, RunCardFragment } from '../generated/graphql'
import { useRelevantRun } from '../composables/useRelevantRun'
import type { RunsComposable } from './RunsComposable'

gql`
  query RunsGitTree($runIds: [ID!]!) {
    ...RunsGitTreeProject
  }
`

gql `
fragment RunsGitTreeProject on Query {
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
      }
    }
  }
  cloudNodesByIds(ids: $runIds) {
    id
    ...RunCard
  }
}
`

export const useGitTreeRuns = (online: Ref<boolean>): RunsComposable => {
  const relevantRuns = useRelevantRun('RUNS')

  const variables = computed(() => {
    return {
      runIds: relevantRuns?.value.latest?.map((run) => run.runId) || [],
    }
  })

  const shouldPauseQuery = computed(() => {
    return !variables.value.runIds
  })

  const query = useQuery({ query: RunsGitTreeDocument, variables, pause: shouldPauseQuery, requestPolicy: 'network-only' })

  const runs = computed(() => {
    const nodes = query.data.value?.cloudNodesByIds?.filter((val): val is RunCardFragment => val?.__typename === 'CloudRun')

    return nodes
  })

  const allRunIds = computed(() => {
    return relevantRuns?.value.all?.map((run) => run.runId) || []
  })

  const currentCommitInfo = computed(() => {
    return relevantRuns?.value.currentCommitInfo
  })

  function reExecuteRunsQuery () {
    query.executeQuery()
  }

  return {
    runs,
    reExecuteRunsQuery,
    query,
    allRunIds,
    currentCommitInfo,
  }
}
