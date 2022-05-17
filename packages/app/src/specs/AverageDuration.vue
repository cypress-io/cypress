<template>
  <div
    v-if="!isLoading"
    class="flex justify-center"
    data-cy="run-status-dots"
  >
    {{ getDurationString(props.gql?.cloudSpec?.data?.averageDuration ?? 0 ) }}
    <!-- {{ props.gql?.cloudSpec?.status }} -->
  </div>
</template>

<script setup lang="ts">

import type { /*RemoteFetchableStatus,*/ AverageDurationFragment } from '../generated/graphql'
import { computed } from 'vue'
import { gql } from '@urql/vue'
import { getDurationString } from '@packages/frontend-shared/src/utils/time'

gql`
fragment AverageDuration on Spec {
  id
  cloudSpec {
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
}>(), {
  gql: null,
  isProjectDisconnected: false,
})

const isLoading = computed(() => {
  // const loadingStatuses: RemoteFetchableStatus[] = ['FETCHING', 'NOT_FETCHED']

  return false//props.gql?.cloudSpec?.status !== 'ERRORED' && !props.isProjectDisconnected && loadingStatuses.some((s) => s === props.gql?.cloudSpec?.status)
})

</script>

<style scoped>

</style>
