import { gql, useQuery } from '@urql/vue'
import { Debug_RelevantRunsDocument } from '@packages/app/src/generated/graphql'
import { computed } from 'vue'

gql`
  query Debug_RelevantRuns {
    currentProject {
      id
      relevantRuns {
        current
        next
      }
    }
  }
`

export function useRelevantRun () {
  const runsQuery = useQuery({ query: Debug_RelevantRunsDocument })

  return computed<{current?: number, next?: number}>(() => {
    return runsQuery.data.value?.currentProject?.relevantRuns || { current: undefined, next: undefined }
  })
}
