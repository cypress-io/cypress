import { gql, useSubscription } from '@urql/vue'
import { computed, Ref, ref, unref, watch, watchEffect } from 'vue'
import { DebugProgress_DebugTestsFragment, DebugProgress_SpecsDocument } from '../generated/graphql'

gql`
subscription DebugProgress_Specs($id: ID!) {
  relevantRunSpecChange(runId: $id) {
    cloudNode(id: $id) {
      id
      ... on CloudRun {
        ...DebugProgress_DebugTests
      }
    }
  }
}
`

export function useDebugRunSummary (run: DebugProgress_DebugTestsFragment | Ref<DebugProgress_DebugTestsFragment | null>) {
  const shouldPause = ref(true)

  const runToWatch = computed(() => unref(run))

  const specs = useSubscription({
    query: DebugProgress_SpecsDocument,
    variables: {
      id: runToWatch.value?.id || '',
    },
    pause: shouldPause,
  })

  watch(specs.data, (val) => {
    /* eslint-disable no-console */
    console.log(`Subscribed for ${runToWatch.value?.runNumber} -> got data`, val)
  })

  // We pause the subscription if status is anything but RUNNING
  watchEffect(() => {
    const status = runToWatch.value?.status
    const id = runToWatch.value?.id

    shouldPause.value = id === undefined || status === undefined || status !== 'RUNNING'
    console.log('debug progress for', runToWatch.value?.id, runToWatch.value?.runNumber, status, shouldPause.value)
  })
}
