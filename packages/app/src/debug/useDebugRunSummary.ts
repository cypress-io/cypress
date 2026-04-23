import { gql, useSubscription } from '@urql/vue'
import { computed, ref, unref, watchEffect } from 'vue'
import type { DebugProgress_DebugTestsFragment } from '../generated/graphql'
import { DebugProgress_SpecsDocument } from '../generated/graphql'
import type { Ref } from 'vue'

gql`
subscription DebugProgress_Specs($id: ID!) {
  relevantRunSpecChange(runId: $id) {
    id
    ...DebugProgress_DebugTests
  }
}
`

/**
 * This composable wraps a subscription that will connect to a poller in the RelevantRunSpecsDataSource.
 * The composable does not return any values, but the CloudRun that is returned in the subscription will be updated
 * in the Urql cache.
 * @param run to watch for updates via a subscription to the backend
 */
export function useDebugRunSummary (run: DebugProgress_DebugTestsFragment | Ref<DebugProgress_DebugTestsFragment | null>) {
  const shouldPause = ref(true)

  const runToWatch = computed(() => unref(run))

  useSubscription({
    query: DebugProgress_SpecsDocument,
    variables: {
      id: runToWatch.value?.id || '',
    },
    pause: shouldPause,
  })

  // We pause the subscription if status is anything but RUNNING
  watchEffect(() => {
    const status = runToWatch.value?.status
    const id = runToWatch.value?.id

    shouldPause.value = id === undefined || status === undefined || status !== 'RUNNING'
  })
}
