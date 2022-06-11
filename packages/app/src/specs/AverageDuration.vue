<template>
  <div
    v-if="props.gql.averageDuration"
    class="h-full grid text-gray-700 justify-end items-center"
    data-cy="average-duration"
  >
    {{ getDurationString(props.gql.averageDuration) }}
  </div>
</template>

<script setup lang="ts">

import type { AverageDurationFragment } from '../generated/graphql'
import { gql } from '@urql/vue'
import { getDurationString } from '@packages/frontend-shared/src/utils/time'

gql`
fragment AverageDuration on CloudProjectSpec {
  id
  averageDuration(fromBranch: $fromBranch)
}
`

const props = defineProps<{
  gql: AverageDurationFragment
}>()

</script>
