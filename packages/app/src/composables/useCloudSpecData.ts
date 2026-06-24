import { gql, useMutation } from '@urql/vue'
import { Ref, computed, watch } from 'vue'
import { useDebounce } from '@vueuse/core'
import { CloudData_RefetchDocument, SpecsListFragment } from '../generated/graphql'

gql`
mutation CloudData_Refetch ($ids: [ID!]!) {
  loadRemoteFetchables(ids: $ids){
    id
    fetchingStatus
  }
}
`

type NonNullCloudSpec = Exclude<SpecsListFragment['cloudSpec'], undefined | null>

/**
 * Set up watchers & subscriptions to clear/refetch cloud data based on project state relative to latest data in the cloud
 * @param isProjectDisconnected Whether project has a valid connection to the cloud
 * @param isOffline  Whether app is currently offline (network state)
 * @param projectId Cloud project ID (slug)
 * @param mostRecentUpdate Date/time of the latest project update in the cloud
 * @param displayedSpecs Spec entries currently displayed in the app
 * @param allSpecs All project spec entries
 * @returns Trigger functions
 */
export function useCloudSpecData (
  isProjectDisconnected: Ref<boolean>,
  isOffline: Ref<boolean>,
  mostRecentUpdate: Ref<string | null>,
  displayedSpecs: Ref<(SpecsListFragment | undefined)[]>,
  allSpecs: (SpecsListFragment | undefined)[],
) {
  const refetchMutation = useMutation(CloudData_RefetchDocument)

  const isCloudSpecOlderThan = (item: NonNullCloudSpec, comparisonDttm: string | null) => {
    if (item.data?.__typename !== 'CloudProjectSpec' && item.data?.__typename !== 'CloudProjectSpecNotFound') {
      return false
    }

    if (!item.data.retrievedAt || !comparisonDttm) {
      return false
    }

    return new Date(comparisonDttm).getTime() > new Date(item.data.retrievedAt).getTime()
  }

  const shouldRefetch = (item: NonNullCloudSpec) => {
    if (isOffline.value) {
      // Offline, no need to refetch
      return false
    }

    if (item.fetchingStatus === 'NOT_FETCHED' || item.fetchingStatus === undefined) {
      // Not yet fetched
      return true
    }

    if (isCloudSpecOlderThan(item, mostRecentUpdate.value)) {
      // outdated
      return true
    }

    // nothing new, no need to refetch
    return false
  }

  /**
   * Refetch any displayed RemoteFetchable entries that are older than the latest cloudProject update
   * or that have not yet been fetched
   */
  const fetchDisplayedCloudData = async () => {
    const cloudSpecIdsToRefetch = displayedSpecs.value
    .map((spec) => spec?.cloudSpec)
    .filter((cloudSpec): cloudSpec is NonNullCloudSpec => Boolean(cloudSpec && shouldRefetch(cloudSpec)))
    .map((cloudSpec) => cloudSpec.id)
    ?? []

    if (!isProjectDisconnected.value && !refetchMutation.fetching.value && cloudSpecIdsToRefetch.length > 0) {
      await refetchMutation.executeMutation({ ids: cloudSpecIdsToRefetch })
    }
  }

  /**
   * Refetch any cloudSpec entries that are in an Error state
   */
  const refetchFailedCloudData = async () => {
    const latestRunsIds = allSpecs
    .map((s) => s?.cloudSpec)
    .filter((cloudSpec): cloudSpec is NonNullCloudSpec => Boolean(cloudSpec?.fetchingStatus === 'ERRORED'))
    .map((cloudSpec) => cloudSpec.id) ?? []

    await refetchMutation.executeMutation({ ids: [...latestRunsIds] })
  }

  const displayedSpecIds = computed(() => displayedSpecs.value.map((v) => v?.cloudSpec?.id).filter((id) => !!id).join('|'))
  const debouncedDisplayedSpecIds = useDebounce(displayedSpecIds, 200)

  /*
  Automatically trigger refresh & purge on the following:
  - Set of displayed specs changes (scroll thru virtualized list)
  - Network connectivity state changes
  - Project connectivity state changes
  - Latest update timestamp for cloud project changes
  */
  watch(
    [debouncedDisplayedSpecIds, isOffline, isProjectDisconnected, mostRecentUpdate],
    async () => {
      await fetchDisplayedCloudData()
    },
    { flush: 'post' },
  )

  return {
    fetchDisplayedCloudData,
    refetchFailedCloudData,
  }
}
