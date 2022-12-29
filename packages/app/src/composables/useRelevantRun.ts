import { gql, useQuery } from '@urql/vue'
import { Debug_RelevantRunsDocument } from '@packages/app/src/generated/graphql'
import { computed } from 'vue'

gql`
  query Debug_RelevantRuns {
    currentProject {
      id
      relevantRuns {
        completed
        running
      }
    }
  }
`

export function useRelevantRun () {
  const runsQuery = useQuery({ query: Debug_RelevantRunsDocument })

  return computed<{completed?: number, running?: number}>(() => {
    return runsQuery.data.value?.currentProject?.relevantRuns || { completed: undefined, running: undefined }
  })
}
