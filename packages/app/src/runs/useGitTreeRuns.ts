import { gql, useQuery } from '@urql/vue'
import { Ref, computed } from 'vue'
import { RunsGitTreeDocument, RunCardFragment } from '../generated/graphql'
import { useRelevantRun } from '../composables/useRelevantRun'

gql `
query RunsGitTree($runIds: [ID!]!) {
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
  cloudNodesByIds(ids: $runIds) {
    id
    ...RunCard
  }
}
`

export const useGitTreeRuns = (online: Ref<boolean>) => {
  const relevantRuns = useRelevantRun('RUNS')

  const variables = computed(() => {
    return {
      runIds: relevantRuns?.value.latest?.map((run) => run.runId) || [],
    }
  })

  const shouldPauseQuery = computed(() => {
    return !variables.value.runIds
  })

  const query = useQuery({ query: RunsGitTreeDocument, variables, pause: shouldPauseQuery })

  const runs = computed(() => {
    const nodes = query.data.value?.cloudNodesByIds

    return nodes as RunCardFragment[]
  })

  function reExecuteRunsQuery () {
    query.executeQuery()
  }

  return {
    currentProject: undefined,
    runs,
    reExecuteRunsQuery,
    query, //TODO remove
  }
}
