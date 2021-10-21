<template>
  <i-cy-status-passed-solid_x24
    v-if="props.gql.status === 'PASSED'"
    class="h-24px w-24px"
  />
  <i-cy-status-failed-solid_x24
    v-else-if="props.gql.status ==='FAILED'"
    class="h-24px w-24px"
  />
  <i-cy-status-errored-solid_x24
    v-else-if="props.gql.status === 'CANCELLED'"
    class="h-24px w-24px"
  />
  <ProgressCircle
    v-else
    :progress="progress"
    :radius="12"
    :stroke="2"
    class="text-indigo-400"
  />
</template>

<script lang="ts" setup>
import { gql } from '@urql/vue'
import ProgressCircle from '@cy/components/ProgressCircle.vue'
import type { RunIconFragment } from '../generated/graphql'

gql`
fragment RunIcon on CloudRun {
	id
	status
}
`

const props = defineProps<{
  gql: RunIconFragment
}>()

// TODO: figure out how/if we can get number tests passed / num tests to run
const progress = typeof props.gql.status === 'number' ? props.gql.status : 0
</script>
