<template>
  <div
    v-if="props.gql?.avgDurationInfo?.fetchingStatus === 'FETCHED' && props.gql?.avgDurationInfo.data?.__typename === 'CloudProjectSpec' && props.gql?.avgDurationInfo?.data?.averageDuration"
    class="h-full grid text-gray-700 justify-end items-center"
    data-cy="average-duration"
  >
    {{ getDurationString(props.gql?.avgDurationInfo?.data?.averageDuration ?? 0 ) }}
  </div>
</template>

<script setup lang="ts">

import { AverageDurationFragment, AverageDuration_RefetchDocument } from '../generated/graphql'
import { gql, useMutation } from '@urql/vue'
import { getDurationString } from '@packages/frontend-shared/src/utils/time'
import { ref, watch } from 'vue'

gql`
mutation AverageDuration_Refetch ($ids: [ID!]!) {
  loadRemoteFetchables(ids: $ids){
    id
    fetchingStatus
  }
}
`

const refetchMutation = useMutation(AverageDuration_RefetchDocument)

const isRefetching = ref(false)

const refetch = async () => {
  if (!props.isProjectDisconnected && props.gql?.avgDurationInfo?.id && !refetchMutation.fetching.value) {
    isRefetching.value = true

    await refetchMutation.executeMutation({ ids: [props.gql?.avgDurationInfo?.id] })
    isRefetching.value = false
  }
}

gql`
fragment AverageDuration on Spec {
  id
  fileName
  avgDurationInfo: cloudSpec(name: "AverageDuration") {
    id
    fetchingStatus
    data {
      ... on CloudProjectSpecNotFound {
        retrievedAt
      }
      ... on CloudProjectSpec {
        id
        averageDuration(fromBranch: $fromBranch)
        retrievedAt
      }
    }
  }
}
`

const props = withDefaults(defineProps<{
  gql: AverageDurationFragment | null
  isProjectDisconnected: boolean
  isOnline: boolean
  mostRecentUpdate: string | null
}>(), {
  gql: null,
  isProjectDisconnected: false,
  isOnline: true,
  mostRecentUpdate: null,
})

function shouldRefetch () {
  if (isRefetching.value) {
    // refetch in progress, no need to refetch

    return false
  }

  if (!props.isOnline) {
    // Offline, no need to refetch

    return false
  }

  if (props.gql?.avgDurationInfo?.fetchingStatus === 'NOT_FETCHED' || props.gql?.avgDurationInfo?.fetchingStatus === undefined) {
    // NOT_FETCHED, refetch

    return true
  }

  if (props.mostRecentUpdate) {
    if (
      (
        props.gql?.avgDurationInfo?.data?.__typename === 'CloudProjectSpecNotFound' ||
        props.gql?.avgDurationInfo?.data?.__typename === 'CloudProjectSpec'
      )
      && (
        props.gql.avgDurationInfo.data.retrievedAt &&
        props.mostRecentUpdate > props.gql.avgDurationInfo.data.retrievedAt
      )
    ) {
      // outdated, refetch

      return true
    }
  }

  // nothing new, no need to refetch

  return false
}

watch(() => props.isOnline,
  async () => {
    if (shouldRefetch()) {
      await refetch()
    }
  }, { immediate: true })

watch(() => props.isProjectDisconnected,
  async () => {
    if (shouldRefetch()) {
      await refetch()
    }
  }, { immediate: true })

watch(() => props.mostRecentUpdate,
  async () => {
    if (shouldRefetch()) {
      await refetch()
    }
  }, { immediate: true })

</script>

<style scoped>

</style>
