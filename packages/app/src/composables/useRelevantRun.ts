import { gql, useQuery } from '@urql/vue'
import { Debug_RelevantRunsDocument } from '@packages/app/src/generated/graphql'
import { first } from 'lodash'
import { computed } from 'vue'

gql`
    query Debug_RelevantRuns {
        currentProject {
            id
            relevantRuns
        }
    }
`

export function useRelevantRun () {
  const runsQuery = useQuery({ query: Debug_RelevantRunsDocument })

  return computed(() => {
    return first(runsQuery.data.value?.currentProject?.relevantRuns)
  })
}
