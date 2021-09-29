<template>
  <IconPass
    v-if="props.gql.status === 'PASSED'"
    class="text-jade-500 text-xl"
  />
  <IconFail
    v-else-if="props.gql.status ==='FAILED'"
    class="text-red-500 text-xl"
  />
  <IconWarn
    v-else-if="props.gql.status === 'CANCELLED'"
    class="text-orange-400 text-xl"
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
import IconPass from '../icons/pass.svg?component'
import IconFail from '../icons/fail.svg?component'
import IconWarn from '../icons/warn.svg?component'
import ProgressCircle from '../components/progress/ProgressCircle.vue'
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
