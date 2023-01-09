import { gql, useSubscription } from '@urql/vue'
import { Debug_RelevantRuns_SubscriptionDocument } from '@packages/app/src/generated/graphql'
import { computed } from 'vue'

gql`
  subscription Debug_RelevantRuns_Subscription {
    relevantRuns {
      current
      next
    }
  }

`

export function useRelevantRun () {
  //const runsQuery = useQuery({ query: Debug_RelevantRunsDocument })

  const subscriptionResponse = useSubscription({ query: Debug_RelevantRuns_SubscriptionDocument })

  return computed(() => {
    return subscriptionResponse.data.value?.relevantRuns
  })
}
