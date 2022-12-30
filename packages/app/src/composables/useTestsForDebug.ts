import { gql, useQuery } from '@urql/vue'
import { Debug_TestsForDebugDocument } from '@packages/app/src/generated/graphql'
import { computed } from 'vue'

gql`
  query Debug_TestsForDebug($specTitle: String!) {
    currentProject {
      id
      testsForReviewBySpec(specTitle: $specTitle)
    }
  }
`

export function useTestsForDebug () {
  const variables = { specTitle: '' }

  const query = useQuery({ query: Debug_TestsForDebugDocument, variables, pause: true })

  return (specTitle: string) => {
    variables.specTitle = specTitle

    const results = query.executeQuery()

    return computed(() => results.data.value)
  }
}
