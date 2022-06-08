<template>
  <div
    v-if="props.gql?.avgDurationInfo?.status === 'FETCHED' && props.gql?.avgDurationInfo.data?.__typename === 'CloudProjectSpec' && props.gql?.avgDurationInfo?.data?.averageDuration"
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
import { watch, watchEffect } from 'vue'

gql`
mutation AverageDuration_Refetch ($ids: [ID!]!) {
  loadRemoteFetchables(ids: $ids){
    id
    fetchingStatus
  }
}
`

const refetchMutation = useMutation(AverageDuration_RefetchDocument)

const refetch = () => {
  if (!props.isProjectDisconnected && props.gql?.avgDurationInfo?.id && !refetchMutation.fetching.value) {
    refetchMutation.executeMutation({ ids: [props.gql?.avgDurationInfo?.id] })
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
      ... on CloudProjectSpec {
        id
        averageDuration
      }
    }
  }
}
`

const props = withDefaults(defineProps<{
  gql: AverageDurationFragment | null
  isProjectDisconnected: boolean
  isOnline: boolean
}>(), {
  gql: null,
  isProjectDisconnected: false,
  isOnline: true,
})

watchEffect(
  () => {
    if (props.isOnline && (props.gql?.avgDurationInfo?.status === 'NOT_FETCHED' || props.gql?.avgDurationInfo?.status === undefined)) {
      refetch()
    }
  },
)

watch(() => props.isProjectDisconnected, (value, oldValue) => {
  if (value && !oldValue) {
    refetch()
  }
})

</script>

<style scoped>

</style>
