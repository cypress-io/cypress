<template>
	<IconPass v-if="props.status === 'passed'" class="text-green-500 text-xl" />
	<IconFail v-else-if="props.status ==='failed'" class="text-red-500 text-xl"/>
	<IconWarn v-else-if="props.status === 'cancelled'" class="text-orange-400 text-xl"/>
	<ProgressCircle v-else :progress="progress" :radius="12" :stroke="2" class="text-indigo-400"/>
</template>

<script lang="ts" setup>
import IconPass from '../icons/pass.svg?component'
import IconFail from '../icons/fail.svg?component'
import IconWarn from '../icons/warn.svg?component'

import ProgressCircle from "../components/progress/ProgressCircle.vue"
import type { RunGroupStatus } from '../generated/graphql'

const props = defineProps<{
  status: RunGroupStatus
}>()

// TODO: figure out how/if we can get number tests passed / num tests to run
const progress = typeof props.status === 'number' ? props.status : 0

</script>