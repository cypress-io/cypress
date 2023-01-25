import { gql, useSubscription } from '@urql/vue'
import { computed } from 'vue'
import { Debug_RelevantRuns_SubscriptionDocument } from '../generated/graphql'

gql`
  subscription Debug_RelevantRuns_Subscription {
    relevantRuns {
      current
      next
      commitsAhead
    }
  }

`

export function useRelevantRun () {
  const subscriptionResponse = useSubscription({ query: Debug_RelevantRuns_SubscriptionDocument })

  return computed(() => {
    return subscriptionResponse.data.value?.relevantRuns
  })
}
