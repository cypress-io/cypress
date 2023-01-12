import { gql, useSubscription } from '@urql/vue'
import { Debug_RelevantRuns_SubscriptionDocument } from '@packages/app/src/generated/graphql'
import { computed } from 'vue'

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
