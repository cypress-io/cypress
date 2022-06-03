<template>
  <div
    v-if="props.gql?.avgDurationInfo?.status === 'FETCHED' && props.gql?.avgDurationInfo?.data?.averageDuration"
    class="flex justify-end"
    data-cy="run-status-dots"
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
    status
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
  # TODO: change this fragment to be "fragment AverageDuration on CloudProjectSpec" and move the status logic up
  avgDurationInfo: cloudSpec(name: "AverageDuration") {
    id
    status
    data {
      id
      averageDuration
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
