import { gql, useSubscription } from '@urql/vue'
import { Debug_RelevantRuns_SubscriptionDocument, Sidebar_RelevantRuns_SubscriptionDocument } from '../generated/graphql'
import { useUserProjectStatusStore } from '@packages/frontend-shared/src/store/user-project-status-store'

import { computed } from 'vue'
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
      runId
      runNumber
      sha
      status
    }
    latest {
      runId
      runNumber
      sha
      status
    }
    commitsAhead
    selectedRunNumber
    currentCommitInfo {
      sha
      message
    }
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

export function useRelevantRun (location: 'SIDEBAR' | 'DEBUG' | 'RUNS' | 'SPECS') {
  const userProjectStatusStore = useUserProjectStatusStore()

  const shouldPause = computed(() => {
    return !userProjectStatusStore.project.isProjectConnected
  })

  //Switch the subscription query depending on where it was registered from
  let query = Debug_RelevantRuns_SubscriptionDocument

  if (location === 'SIDEBAR') {
    query = Sidebar_RelevantRuns_SubscriptionDocument
  }

  const subscriptionResponse = useSubscription({ query, variables: { location }, pause: shouldPause })

  return computed(() => {
    const allRuns = subscriptionResponse.data.value?.relevantRuns?.all
    const selectedRunNumber = subscriptionResponse.data.value?.relevantRuns?.selectedRunNumber

    const selectedRun = allRuns?.find((run) => run.runNumber === selectedRunNumber)

    const commitShas = uniq(allRuns?.map((run) => run.sha))

    return {
      all: subscriptionResponse.data.value?.relevantRuns?.all,
      latest: subscriptionResponse.data.value?.relevantRuns?.latest,
      commitsAhead: subscriptionResponse.data.value?.relevantRuns?.commitsAhead,
      selectedRun,
      commitShas,
      currentCommitInfo: subscriptionResponse.data.value?.relevantRuns?.currentCommitInfo,
    }
  })
}
