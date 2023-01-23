import { gql, useSubscription } from '@urql/vue'
import { Debug_RelevantRuns_SubscriptionDocument } from '@packages/app/src/generated/graphql'
import { useLoginConnectStore } from '@packages/frontend-shared/src/store/login-connect-store'

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
  const loginConnectStore = useLoginConnectStore()

  const shouldPause = computed(() => {
    return !loginConnectStore.project.isProjectConnected
  })

  const subscriptionResponse = useSubscription({ query: Debug_RelevantRuns_SubscriptionDocument, pause: shouldPause })

  return computed(() => {
    return subscriptionResponse.data.value?.relevantRuns
  })
}
