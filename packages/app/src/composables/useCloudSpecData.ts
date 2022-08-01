import { gql, useMutation } from '@urql/vue'
import { Ref, computed, watch } from 'vue'
import { useDebounce } from '@vueuse/core'
import { PurgeCloudSpecCacheDocument, CloudData_RefetchDocument, SpecsListFragment } from '../generated/graphql'

gql`
mutation CloudData_Refetch ($ids: [ID!]!) {
  loadRemoteFetchables(ids: $ids){
    id
    fetchingStatus
  }
}
`

gql`
mutation PurgeCloudSpecCache ($projectSlug: String!, $specPaths: [String!]!) {
  purgeCloudSpecByPathCache(projectSlug: $projectSlug, specPaths: $specPaths) {
    __typename
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
  projectId: string | null | undefined,
  mostRecentUpdate: Ref<string | null>,
  displayedSpecs: Ref<(SpecsListFragment | undefined)[]>,
  allSpecs: (SpecsListFragment | undefined)[],
) {
  const refetchMutation = useMutation(CloudData_RefetchDocument)
  const purgeCloudSpecCacheMutation = useMutation(PurgeCloudSpecCacheDocument)
  const refetch = async (ids: string[]) => {
    if (!isProjectDisconnected.value && !refetchMutation.fetching.value) {
      await refetchMutation.executeMutation({ ids })
    }
  }

  const purgeCloudSpecCache = async (paths: string[]) => {
    if (!!projectId && paths && paths.length > 0) {
      await purgeCloudSpecCacheMutation.executeMutation({ projectSlug: projectId, specPaths: paths })
    }
  }

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

  const shouldPurge = (item: NonNullCloudSpec) => {
    if (isCloudSpecOlderThan(item, mostRecentUpdate.value)) {
      // outdated, refetch
      return true
    }

    // nothing new, no need to refetch
    return false
  }

  const getIdsToRefetch = () => {
    return displayedSpecs.value
    .map((spec) => spec?.cloudSpec)
    .filter((cloudSpec): cloudSpec is NonNullCloudSpec => Boolean(cloudSpec && shouldRefetch(cloudSpec)))
    .map((cloudSpec) => cloudSpec.id)
    ?? []
  }

  const getSpecPathsToPurge = () => {
    return allSpecs
    .filter((spec) => Boolean(spec?.cloudSpec && shouldPurge(spec?.cloudSpec)))
    .map((spec) => spec?.relative)
    .filter((val): val is string => !!val)
    ?? []
  }

  const fetchDisplayedCloudData = async () => {
    const cloudSpecIds = getIdsToRefetch()

    if (cloudSpecIds.length > 0) {
      await refetch(cloudSpecIds)
    }
  }

  const purgeOutdatedCloudData = async () => {
    const cloudSpecPaths = getSpecPathsToPurge()

    if (cloudSpecPaths.length > 0) {
      await purgeCloudSpecCache(cloudSpecPaths)
    }
  }

  const refetchFailedCloudData = async () => {
    const latestRunsIds = allSpecs
    .map((s) => s?.cloudSpec)
    .filter((cloudSpec): cloudSpec is NonNullCloudSpec => Boolean(cloudSpec?.fetchingStatus === 'ERRORED'))
    .map((cloudSpec) => cloudSpec.id) ?? []

    await refetchMutation.executeMutation({ ids: [...latestRunsIds] })
  }

  const displayedSpecIds = computed(() => displayedSpecs.value.map((v) => v?.cloudSpec?.id).join('|'))
  const debouncedDisplayedSpecIds = useDebounce(displayedSpecIds, 200)

  watch([debouncedDisplayedSpecIds, isOffline, isProjectDisconnected, mostRecentUpdate], () => {
    fetchDisplayedCloudData()
    purgeOutdatedCloudData()
  }, {
    flush: 'post',
  })

  return {
    fetchDisplayedCloudData,
    refetchFailedCloudData,
  }
}
