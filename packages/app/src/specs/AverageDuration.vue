<template>
  <div
    v-if="props.gql?.avgDurationInfo?.status === 'FETCHED' && props.gql?.avgDurationInfo?.data?.averageDuration"
    class="flex justify-center"
    data-cy="run-status-dots"
  >
    {{ getDurationString(props.gql?.avgDurationInfo?.data?.averageDuration ?? 0 ) }}
  </div>
  <!-- <div
    v-else-if="props.gql?.avgDurationInfo?.status === 'ERRORED'"
    class="flex justify-center"
    data-cy="run-status-dots"
  >
    {{ props.gql?.avgDurationInfo?.status }}
  </div> -->
</template>

<script setup lang="ts">

import type { AverageDurationFragment } from '../generated/graphql'
import { gql } from '@urql/vue'
import { getDurationString } from '@packages/frontend-shared/src/utils/time'

gql`
fragment AverageDuration on Spec {
  id
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
}>(), {
  gql: null,
  isProjectDisconnected: false,
})

</script>

<style scoped>

</style>
