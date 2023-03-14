import { gql } from '@urql/vue'
import { Debug_RelevantRuns_SubscriptionDocument, Sidebar_RelevantRuns_SubscriptionDocument } from '@packages/app/src/generated/graphql'
import { useLoginConnectStore } from '@packages/frontend-shared/src/store/login-connect-store'

import { computed } from 'vue'
import { useSubscription } from '../graphql'

/**
 * Using two different subscriptions with different names in order for urql to treat them separately.
 *
 * Currently, this composable is used in two places and can have two subscriptions running at one time.
 * Without having two separately named subscriptions, urql would not tell the websocket that one of the
 * subscriptions had ended when the component it was registered in was unmounted.
 */
gql`

  fragment UseRelevantRun on RelevantRun {
    all
    commitsAhead
  }

  subscription Debug_RelevantRuns_Subscription($location: RelevantRunLocationEnum!) {
    relevantRuns(location: $location) {
      ...UseRelevantRun
    }
  }

  subscription Sidebar_RelevantRuns_Subscription($location: RelevantRunLocationEnum!) {
    relevantRuns(location: $location) {
      ...UseRelevantRun
    }
  }

`

export function useRelevantRun (location: 'SIDEBAR' | 'DEBUG') {
  const loginConnectStore = useLoginConnectStore()

  const shouldPause = computed(() => {
    return !loginConnectStore.project.isProjectConnected
  })

  //Switch the subscription query depending on where it was registered from
  let query = Debug_RelevantRuns_SubscriptionDocument

  if (location === 'SIDEBAR') {
    query = Sidebar_RelevantRuns_SubscriptionDocument
  }

  const subscriptionResponse = useSubscription({ query, variables: { location }, pause: shouldPause })

  return computed(() => {
    return subscriptionResponse.data.value?.relevantRuns
  })
}
