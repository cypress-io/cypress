<template>
  <div
    v-if="props.gql?.data?.__typename === 'CloudProjectSpec' && props.gql?.data?.averageDurationForRunIds"
    class="h-full grid text-gray-700 justify-end items-center"
    data-cy="average-duration"
  >
    {{ getDurationString(props.gql.data.averageDurationForRunIds) }}
  </div>
  <div
    v-else
    class="h-full grid text-gray-400 justify-end items-center"
  >
    --
  </div>
</template>

<script setup lang="ts">

import type { AverageDurationFragment } from '../generated/graphql'
import { gql } from '@urql/vue'
import { getDurationString } from '@packages/frontend-shared/src/utils/time'

gql`
fragment AverageDuration on RemoteFetchableCloudProjectSpecResult {
  id
  data {
    ... on CloudProjectSpecNotFound {
      retrievedAt
    }
    ... on CloudProjectSpec {
      id
      retrievedAt
      averageDurationForRunIds(cloudRunIds: $runIds)
    }
  }
}
`

const props = defineProps<{
  gql: AverageDurationFragment | null
}>()

</script>
