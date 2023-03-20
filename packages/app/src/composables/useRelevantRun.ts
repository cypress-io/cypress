import { gql, useSubscription } from '@urql/vue'
import { Debug_RelevantRuns_SubscriptionDocument, Sidebar_RelevantRuns_SubscriptionDocument } from '@packages/app/src/generated/graphql'
import { useLoginConnectStore } from '@packages/frontend-shared/src/store/login-connect-store'
import { useDebugStore } from '../store/debug-store'

import { computed, onBeforeUnmount, onMounted } from 'vue'
import { uniq } from 'lodash'

/**
 * Using two different subscriptions with different names in order for urql to treat them separately.
 *
 * Currently, this composable is used in two places and can have two subscriptions running at one time.
 * Without having two separately named subscriptions, urql would not tell the websocket that one of the
 * subscriptions had ended when the component it was registered in was unmounted.
 */
gql`

  fragment UseRelevantRun on RelevantRun {
    all {
      runNumber
      sha
    }
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
  const debugStore = useDebugStore()

  onMounted(() => {
    if (location === 'DEBUG') {
      debugStore.lockSelectedRunNumber()
    }
  })

  onBeforeUnmount(() => {
    if (location === 'DEBUG') {
      debugStore.unlockSelectedRunNumber()
    }
  })

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
    const allRuns = subscriptionResponse.data.value?.relevantRuns?.all
    const latestRun = allRuns?.[0]

    let selectedRun = debugStore.selectedRun

    //TODO Figure out logic to watch for the selected run being locked
    if (!selectedRun) {
      selectedRun = latestRun
      debugStore.setSelectedRun(selectedRun)
    }

    const commitShas = uniq(allRuns?.map((run) => run.sha))

    return {
      all: subscriptionResponse.data.value?.relevantRuns?.all,
      commitsAhead: subscriptionResponse.data.value?.relevantRuns?.commitsAhead,
      selectedRun,
      commitShas,
    }
  })
}
